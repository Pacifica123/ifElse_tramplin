use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2,
};
use sqlx::PgPool;

use crate::{
    auth::{dto::MeResponse, repo as auth_repo},
    error::{AppError, AppResult},
    models::AppRole,
};

use super::{dto::{CreateCuratorRequest, CreateCuratorRole}, repo};

pub async fn create_curator(
    pool: &PgPool,
    requester_role: AppRole,
    req: CreateCuratorRequest,
) -> AppResult<MeResponse> {
    if requester_role != AppRole::AdminCurator {
        return Err(AppError::forbidden("Only admin curator can create curators"));
    }

    let email = req.email.trim().to_lowercase();
    let display_name = req.display_name.trim().to_string();
    let full_name = req.full_name.trim().to_string();
    let position = req.position.map(|v| v.trim().to_string()).filter(|v| !v.is_empty());
    let role: AppRole = req.role.unwrap_or(CreateCuratorRole::Curator).into();

    if email.is_empty() || !email.contains('@') {
        return Err(AppError::bad_request("Invalid email"));
    }
    if display_name.is_empty() {
        return Err(AppError::bad_request("displayName is required"));
    }
    if full_name.is_empty() {
        return Err(AppError::bad_request("fullName is required"));
    }
    if req.password.len() < 8 {
        return Err(AppError::bad_request("Password must be at least 8 characters"));
    }

    if auth_repo::find_user_by_email(pool, &email).await?.is_some() {
        return Err(AppError::conflict("User with this email already exists"));
    }

    let password_hash = hash_password(&req.password)?;

    let mut tx = pool.begin().await?;
    let user = repo::insert_curator_user(&mut tx, &email, &display_name, &password_hash, role)
        .await
        .map_err(map_insert_error)?;
    repo::insert_curator_profile(&mut tx, user.id, &full_name, position.as_deref())
        .await
        .map_err(AppError::from)?;
    tx.commit().await?;

    Ok(MeResponse::from(&user))
}

fn hash_password(password: &str) -> AppResult<String> {
    let salt = SaltString::generate(&mut OsRng);

    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|_| AppError::internal())
}

fn map_insert_error(err: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(db_err) = &err {
        if db_err.code().as_deref() == Some("23505") {
            return AppError::conflict("User with this email already exists");
        }
    }

    AppError::from(err)
}
