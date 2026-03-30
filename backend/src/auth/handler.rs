use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::{
    error::AppResult,
    http::middleware::require_auth_user,
    state::AppState,
};

use super::{
    dto::{
        AuthResponse, LoginRequest, RegisterRequest,
        LogoutRequest, RefreshTokenRequest,
    },
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

pub async fn refresh(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<RefreshTokenRequest>,
) -> AppResult<Json<AuthResponse>> {
    let user_agent = extract_user_agent(&headers);

    let response = service::refresh(&state.db, &state.settings.auth, req, user_agent).await?;

    Ok(Json(response))
}

pub async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<LogoutRequest>,
) -> AppResult<StatusCode> {
    let auth_user = require_auth_user(&state, &headers).await?;
    service::logout(&state.db, auth_user.id, req).await?;
    Ok(StatusCode::NO_CONTENT)
}

fn extract_user_agent(headers: &HeaderMap) -> Option<&str> {
    headers.get("user-agent").and_then(|value| value.to_str().ok())
}