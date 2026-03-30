use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use sqlx::PgPool;

use crate::{
    config::AuthSettings,
    error::{AppError, AppResult},
    models::{AppRole, UserRow},
};

use super::{
    dto::{AuthResponse, LoginRequest, LogoutRequest, MeResponse, RefreshTokenRequest, RegisterRequest},
    repo,
    token,
};

pub async fn register(
    pool: &PgPool,
    auth: &AuthSettings,
    req: RegisterRequest,
    user_agent: Option<&str>,
) -> AppResult<AuthResponse> {
    let email = req.email.trim().to_lowercase();
    let display_name = req.display_name.trim().to_string();

    if email.is_empty() || !email.contains('@') {
        return Err(AppError::bad_request("Invalid email"));
    }

    if display_name.is_empty() {
        return Err(AppError::bad_request("Display name is required"));
    }

    if req.password.len() < 8 {
        return Err(AppError::bad_request("Password must be at least 8 characters"));
    }

    if repo::find_user_by_email(pool, &email).await?.is_some() {
        return Err(AppError::conflict("User with this email already exists"));
    }

    let password_hash = hash_password(&req.password)?;
    let role: AppRole = req.role.into();

    let mut tx = pool.begin().await?;

    let user = repo::insert_user(&mut tx, &email, &display_name, &password_hash, role)
        .await
        .map_err(map_insert_error)?;

    match role {
        AppRole::Applicant => {
            repo::create_applicant_profile(&mut tx, user.id, &display_name).await?;
        }
        AppRole::Employer => {
            repo::create_employer_profile(&mut tx, user.id, &display_name).await?;
        }
        _ => return Err(AppError::bad_request("Unsupported registration role")),
    }

    tx.commit().await?;

    issue_tokens(pool, auth, &user, user_agent).await
}

pub async fn login(
    pool: &PgPool,
    auth: &AuthSettings,
    req: LoginRequest,
    user_agent: Option<&str>,
) -> AppResult<AuthResponse> {
    let email = req.email.trim().to_lowercase();

    let user = repo::find_user_by_email(pool, &email)
        .await?
        .ok_or_else(|| AppError::unauthorized("Invalid email or password"))?;

    if !user.is_active {
        return Err(AppError::forbidden("User is inactive"));
    }

    verify_password(&user.password_hash, &req.password)?;

    repo::update_last_login(pool, user.id).await?;

    issue_tokens(pool, auth, &user, user_agent).await
}

pub async fn refresh(
    pool: &PgPool,
    auth: &AuthSettings,
    req: RefreshTokenRequest,
    user_agent: Option<&str>,
) -> AppResult<AuthResponse> {
    let raw_refresh_token = req.refresh_token.trim();

    if raw_refresh_token.is_empty() {
        return Err(AppError::unauthorized("Invalid refresh token"));
    }

    let refresh_token_hash = token::hash_refresh_token(raw_refresh_token);

    let stored = repo::find_refresh_token_by_hash(pool, &refresh_token_hash)
        .await?
        .ok_or_else(|| AppError::unauthorized("Invalid refresh token"))?;

    if stored.revoked_at.is_some() {
        return Err(AppError::unauthorized("Refresh token has been revoked"));
    }

    if stored.expires_at <= Utc::now() {
        return Err(AppError::unauthorized("Refresh token has expired"));
    }

    let user = repo::find_user_by_id(pool, stored.user_id)
        .await?
        .ok_or_else(|| AppError::unauthorized("User not found"))?;

    if !user.is_active {
        return Err(AppError::forbidden("User is inactive"));
    }

    repo::revoke_refresh_token_by_hash(pool, &refresh_token_hash).await?;

    issue_tokens(pool, auth, &user, user_agent).await
}

pub async fn logout(
    pool: &PgPool,
    current_user_id: i64,
    req: LogoutRequest,
) -> AppResult<()> {
    let raw_refresh_token = req.refresh_token.trim();

    if raw_refresh_token.is_empty() {
        return Err(AppError::unauthorized("Invalid refresh token"));
    }

    let refresh_token_hash = token::hash_refresh_token(raw_refresh_token);

    let stored = repo::find_refresh_token_by_hash(pool, &refresh_token_hash)
        .await?
        .ok_or_else(|| AppError::unauthorized("Invalid refresh token"))?;

    if stored.user_id != current_user_id {
        return Err(AppError::unauthorized("Refresh token does not belong to current user"));
    }

    repo::revoke_refresh_token_by_hash(pool, &refresh_token_hash).await?;

    Ok(())
}

async fn issue_tokens(
    pool: &PgPool,
    auth: &AuthSettings,
    user: &UserRow,
    user_agent: Option<&str>,
) -> AppResult<AuthResponse> {
    let access_token = token::create_access_token(user, auth)?;
    let refresh_token = token::generate_refresh_token();
    let refresh_token_hash = token::hash_refresh_token(&refresh_token);
    let refresh_expires_at = Utc::now() + Duration::days(auth.refresh_token_ttl_days);

    repo::insert_refresh_token(
        pool,
        user.id,
        &refresh_token_hash,
        refresh_expires_at,
        user_agent,
    )
    .await?;

    Ok(AuthResponse {
        access_token,
        refresh_token,
        user: MeResponse::from(user),
    })
}

fn hash_password(password: &str) -> AppResult<String> {
    let salt = SaltString::generate(&mut OsRng);

    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|_| AppError::internal())
}

fn verify_password(password_hash: &str, password: &str) -> AppResult<()> {
    let parsed_hash = PasswordHash::new(password_hash)
        .map_err(|_| AppError::unauthorized("Invalid email or password"))?;

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::unauthorized("Invalid email or password"))
}

fn map_insert_error(err: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(db_err) = &err {
        if db_err.code().as_deref() == Some("23505") {
            return AppError::conflict("User with this email already exists");
        }
    }

    AppError::from(err)
}