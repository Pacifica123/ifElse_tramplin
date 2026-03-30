use axum::{
    extract::State,
    http::HeaderMap,
    Json,
};

use crate::{
    error::AppResult,
    http::middleware::{require_any_role, require_auth_user},
    models::AppRole,
    state::AppState,
};

use super::{
    dto::PrivacySettingsResponse,
    service,
};

pub async fn get_my_privacy_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> AppResult<Json<PrivacySettingsResponse>> {
    let user = require_auth_user(&state, &headers).await?;
    let user = require_any_role(user, &[AppRole::Applicant])?;

    let payload = service::get_my_privacy_settings(&state.db, user.id).await?;
    Ok(Json(payload))
}

pub async fn patch_my_privacy_settings(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<PrivacySettingsResponse>,
) -> AppResult<Json<PrivacySettingsResponse>> {
    let user = require_auth_user(&state, &headers).await?;
    let user = require_any_role(user, &[AppRole::Applicant])?;

    let payload = service::update_my_privacy_settings(&state.db, user.id, req).await?;
    Ok(Json(payload))
}