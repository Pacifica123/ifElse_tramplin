use axum::http::{header, HeaderMap};

use crate::{
    auth::{repo as auth_repo, token},
    error::{AppError, AppResult},
    models::AppRole,
    state::AppState,
};

#[derive(Debug, Clone, Copy)]
pub struct AuthUser {
    pub id: i64,
    pub role: AppRole,
}

pub async fn require_auth_user(state: &AppState, headers: &HeaderMap) -> AppResult<AuthUser> {
    let raw_token = extract_bearer_token(headers)?;
    let claims = token::decode_access_token(raw_token, &state.settings.auth)?;
    let user = auth_repo::find_user_by_id(&state.db, claims.sub)
        .await?
        .ok_or_else(|| AppError::unauthorized("User not found"))?;

    if !user.is_active {
        return Err(AppError::forbidden("User is inactive"));
    }

    Ok(AuthUser {
        id: user.id,
        role: user.role,
    })
}

pub fn require_any_role(user: AuthUser, allowed: &[AppRole]) -> AppResult<AuthUser> {
    if allowed.iter().any(|role| *role == user.role) {
        Ok(user)
    } else {
        Err(AppError::forbidden("Insufficient permissions"))
    }
}

pub fn require_admin_curator(user: AuthUser) -> AppResult<AuthUser> {
    require_any_role(user, &[AppRole::AdminCurator])
}

fn extract_bearer_token(headers: &HeaderMap) -> AppResult<&str> {
    let raw = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| AppError::unauthorized("Missing Authorization header"))?;

    raw.strip_prefix("Bearer ")
        .ok_or_else(|| AppError::unauthorized("Invalid Authorization header"))
}
