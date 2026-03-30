use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::{
    error::AppResult,
    http::middleware::require_auth_user,
    modules::{
        employer_profiles::dto::EmployerProfileResponse,
        opportunities::dto::OpportunitySummaryResponse,
    },
    state::AppState,
};

use super::service;

pub async fn list_favorite_opportunities(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> AppResult<Json<Vec<OpportunitySummaryResponse>>> {
    let user = require_auth_user(&state, &headers).await?;
    let payload = service::list_favorite_opportunities(&state.db, user.id).await?;
    Ok(Json(payload))
}

pub async fn add_favorite_opportunity(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(opportunity_id): Path<i64>,
) -> AppResult<StatusCode> {
    let user = require_auth_user(&state, &headers).await?;
    service::add_favorite_opportunity(&state.db, user.id, opportunity_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_favorite_opportunity(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(opportunity_id): Path<i64>,
) -> AppResult<StatusCode> {
    let user = require_auth_user(&state, &headers).await?;
    service::remove_favorite_opportunity(&state.db, user.id, opportunity_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_favorite_employers(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> AppResult<Json<Vec<EmployerProfileResponse>>> {
    let user = require_auth_user(&state, &headers).await?;
    let payload = service::list_favorite_employers(&state.db, user.id).await?;
    Ok(Json(payload))
}

pub async fn add_favorite_employer(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(employer_profile_id): Path<i64>,
) -> AppResult<StatusCode> {
    let user = require_auth_user(&state, &headers).await?;
    service::add_favorite_employer(&state.db, user.id, employer_profile_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_favorite_employer(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(employer_profile_id): Path<i64>,
) -> AppResult<StatusCode> {
    let user = require_auth_user(&state, &headers).await?;
    service::remove_favorite_employer(&state.db, user.id, employer_profile_id).await?;
    Ok(StatusCode::NO_CONTENT)
}