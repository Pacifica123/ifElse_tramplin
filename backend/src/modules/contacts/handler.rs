use axum::{
    extract::{Path, State},
    http::HeaderMap,
    Json,
};

use crate::{
    error::AppResult,
    http::middleware::require_auth_user,
    state::AppState,
};

use super::{
    dto::{ContactRequestCreateRequest, ContactResponse, ContactStatusUpdateRequest},
    service,
};
use super::dto::CareerInterestResponse;

pub async fn list_contacts(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> AppResult<Json<Vec<ContactResponse>>> {
    let user = require_auth_user(&state, &headers).await?;
    let payload = service::list_contacts(&state.db, user.id).await?;
    Ok(Json(payload))
}

pub async fn create_contact_request(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<ContactRequestCreateRequest>,
) -> AppResult<Json<ContactResponse>> {
    let user = require_auth_user(&state, &headers).await?;
    let payload = service::create_contact_request(&state.db, user.id, req).await?;
    Ok(Json(payload))
}

pub async fn patch_contact_status(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(contact_id): Path<i64>,
    Json(req): Json<ContactStatusUpdateRequest>,
) -> AppResult<Json<ContactResponse>> {
    let user = require_auth_user(&state, &headers).await?;
    let payload = service::update_contact_status(&state.db, user.id, contact_id, req).await?;
    Ok(Json(payload))
}

pub async fn get_career_interests(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(applicant_profile_id): Path<i64>,
) -> AppResult<Json<Vec<CareerInterestResponse>>> {
    let user = require_auth_user(&state, &headers).await?;
    let payload = service::get_career_interests(&state.db, user.id, applicant_profile_id).await?;
    Ok(Json(payload))
}