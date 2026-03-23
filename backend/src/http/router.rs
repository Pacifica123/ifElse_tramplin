use axum::{
    routing::{get, patch, post},
    Json, Router,
};
use serde::Serialize;
use serde_json::json;

use crate::{
    error::{AppError, AppResult},
    state::AppState,
};

pub fn api_router() -> Router<AppState> {
    Router::new()
        .route("/health", get(api_health))
        .route("/auth/register", post(not_implemented))
        .route("/auth/login", post(not_implemented))
        .route("/auth/refresh", post(not_implemented))
        .route("/auth/logout", post(not_implemented))
        .route("/me", get(not_implemented))
        .route(
            "/applicant-profile/me",
            get(not_implemented).patch(not_implemented),
        )
        .route(
            "/employer-profile/me",
            get(not_implemented).patch(not_implemented),
        )
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: &'static str,
    scope: &'static str,
}

async fn api_health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        scope: "api",
    })
}

async fn not_implemented() -> AppResult<Json<serde_json::Value>> {
    Err(AppError::not_implemented(
        "Endpoint stub is wired, but business logic is not implemented yet",
    ))
}

pub async fn root_health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "service": "trampolin-backend"
    }))
}