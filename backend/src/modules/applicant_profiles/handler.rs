use axum::{
    extract::{Path, State},
    http::{header, HeaderMap},
    Json,
};

use crate::{
    auth::{repo as auth_repo, token},
    error::{AppError, AppResult},
    state::AppState,
};

use super::{
    dto::{
        ApplicantProfileResponse,
        ApplicantProfileUpdateRequest,
        ApplicantProfileViewResponse,
    },
    service,
};

pub async fn get_current(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> AppResult<Json<ApplicantProfileResponse>> {
    let user_id = resolve_user_id(&state, &headers).await?;
    let profile = service::get_current_profile(&state.db, user_id).await?;
    Ok(Json(profile.into()))
}

pub async fn patch_current(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<ApplicantProfileUpdateRequest>,
) -> AppResult<Json<ApplicantProfileResponse>> {
    let user_id = resolve_user_id(&state, &headers).await?;
    let profile = service::update_current_profile(&state.db, user_id, req).await?;
    Ok(Json(profile.into()))
}

pub async fn get_by_id(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(applicant_profile_id): Path<i64>,
) -> AppResult<Json<ApplicantProfileViewResponse>> {
    let viewer_user_id = resolve_user_id(&state, &headers).await?;
    let payload = service::get_visible_profile(&state.db, viewer_user_id, applicant_profile_id).await?;
    Ok(Json(payload))
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
