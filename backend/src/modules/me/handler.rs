use axum::{
    extract::State,
    http::{header, HeaderMap},
    Json,
};

use crate::{
    auth::{dto::MeResponse, repo, token},
    error::{AppError, AppResult},
    state::AppState,
};

pub async fn get_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> AppResult<Json<MeResponse>> {
    let raw_token = extract_bearer_token(&headers)?;
    let claims = token::decode_access_token(raw_token, &state.settings.auth)?;
    let user = repo::find_user_by_id(&state.db, claims.sub)
        .await?
        .ok_or_else(|| AppError::unauthorized("User not found"))?;

    if !user.is_active {
        return Err(AppError::forbidden("User is inactive"));
    }

    Ok(Json(MeResponse::from(&user)))
}

fn extract_bearer_token(headers: &HeaderMap) -> AppResult<&str> {
    let raw = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| AppError::unauthorized("Missing Authorization header"))?;

    raw.strip_prefix("Bearer ")
        .ok_or_else(|| AppError::unauthorized("Invalid Authorization header"))
}