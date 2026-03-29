use axum::{
    routing::{get, patch, post},
    Json, Router,
};
use serde::Serialize;
use serde_json::json;

use crate::{
    auth::handler::{login, register},
    error::{AppError, AppResult},
    modules::{
        applicant_profiles::handler::{get_current as get_current_applicant_profile, patch_current as update_current_applicant_profile},
        employer_dashboard::handler::{
            create_current_verification_request,
            get_current_verification_request,
        },
        employer_profiles::handler::{get_current as get_current_employer_profile, patch_current as update_current_employer_profile},
        me::handler::get_me,
        opportunities::handler::{
            create_own_opportunity,
            get_public_opportunity_by_id,
            list_own_opportunities,
            list_public_opportunities,
            update_own_opportunity,
            update_own_opportunity_status,
        },
        tags::handler::list_tags,
    },
    state::AppState,
};

pub fn api_router() -> Router<AppState> {
    Router::new()
        .route("/health", get(api_health))
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/refresh", post(not_implemented))
        .route("/auth/logout", post(not_implemented))
        .route("/me", get(get_me))
        .route(
            "/applicant-profile/me",
            get(get_current_applicant_profile).patch(update_current_applicant_profile),
        )
        .route(
            "/employer-profile/me",
            get(get_current_employer_profile).patch(update_current_employer_profile),
        )
        .route("/privacy-settings/me", get(not_implemented).patch(not_implemented))
        .route("/opportunities", get(list_public_opportunities).post(create_own_opportunity))
        .route(
            "/opportunities/{id}",
            get(get_public_opportunity_by_id).patch(update_own_opportunity),
        )
        .route("/opportunities/{id}/status", patch(update_own_opportunity_status))
        .route("/opportunities/{id}/applications", post(not_implemented))
        .route("/applications/me", get(not_implemented))
        .route("/employer/opportunities/{id}/applications", get(not_implemented))
        .route("/applications/{id}/status", patch(not_implemented))
        .route("/tags", get(list_tags).post(not_implemented))
        .route(
            "/employer/verification-request",
            get(get_current_verification_request).post(create_current_verification_request),
        )
        .route("/employer/opportunities", get(list_own_opportunities))
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
