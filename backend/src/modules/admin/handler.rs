use axum::{extract::State, http::{HeaderMap, StatusCode}, Json};

use crate::{
    auth::dto::MeResponse,
    error::AppResult,
    http::middleware::{require_admin_curator, require_auth_user},
    state::AppState,
};

use super::{dto::CreateCuratorRequest, service};

pub async fn create_curator(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<CreateCuratorRequest>,
) -> AppResult<(StatusCode, Json<MeResponse>)> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let auth_user = require_admin_curator(auth_user)?;
    let response = service::create_curator(&state.db, auth_user.role, req).await?;
    Ok((StatusCode::CREATED, Json(response)))
}
