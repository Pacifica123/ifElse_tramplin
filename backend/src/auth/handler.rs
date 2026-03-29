use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::{
    error::AppResult,
    state::AppState,
};

use super::{
    dto::{AuthResponse, LoginRequest, RegisterRequest},
    service,
};

pub async fn register(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<RegisterRequest>,
) -> AppResult<(StatusCode, Json<AuthResponse>)> {
    let user_agent = extract_user_agent(&headers);

    let response = service::register(&state.db, &state.settings.auth, req, user_agent).await?;

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn login(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<LoginRequest>,
) -> AppResult<Json<AuthResponse>> {
    let user_agent = extract_user_agent(&headers);

    let response = service::login(&state.db, &state.settings.auth, req, user_agent).await?;

    Ok(Json(response))
}

fn extract_user_agent(headers: &HeaderMap) -> Option<&str> {
    headers.get("user-agent").and_then(|value| value.to_str().ok())
}