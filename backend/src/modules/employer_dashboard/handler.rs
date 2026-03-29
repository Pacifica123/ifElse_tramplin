use axum::{
    extract::State,
    http::{header, HeaderMap, StatusCode},
    Json,
};

use crate::{
    auth::{repo as auth_repo, token},
    error::{AppError, AppResult},
    state::AppState,
};

use super::{dto::{VerificationRequestCreateRequest, VerificationRequestResponse}, service};

pub async fn get_current_verification_request(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> AppResult<Json<VerificationRequestResponse>> {
    let user_id = resolve_user_id(&state, &headers).await?;
    let row = service::get_current_verification_request(&state.db, user_id).await?;
    Ok(Json(map_response(row)))
}

pub async fn create_current_verification_request(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<VerificationRequestCreateRequest>,
) -> AppResult<(StatusCode, Json<VerificationRequestResponse>)> {
    let user_id = resolve_user_id(&state, &headers).await?;
    let row = service::create_current_verification_request(&state.db, user_id, req).await?;
    Ok((StatusCode::CREATED, Json(map_response(row))))
}

fn map_response(row: super::repo::VerificationRequestRow) -> VerificationRequestResponse {
    VerificationRequestResponse {
        id: row.id,
        employer_profile_id: row.employer_profile_id,
        status: row.status,
        comment: row.comment,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        reviewed_by_curator_id: row.reviewed_by_curator_id,
    }
}

async fn resolve_user_id(state: &AppState, headers: &HeaderMap) -> AppResult<i64> {
    let raw_token = extract_bearer_token(headers)?;
    let claims = token::decode_access_token(raw_token, &state.settings.auth)?;
    let user = auth_repo::find_user_by_id(&state.db, claims.sub)
        .await?
        .ok_or_else(|| AppError::unauthorized("User not found"))?;

    if !user.is_active {
        return Err(AppError::forbidden("User is inactive"));
    }

    Ok(user.id)
}

fn extract_bearer_token(headers: &HeaderMap) -> AppResult<&str> {
    let raw = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| AppError::unauthorized("Missing Authorization header"))?;

    raw.strip_prefix("Bearer ")
        .ok_or_else(|| AppError::unauthorized("Invalid Authorization header"))
}
