use axum::{
    routing::{get, patch, post},
    Json, Router,
};
use serde::Serialize;
use serde_json::json;

use crate::{
    auth::handler::{login, logout, refresh, register},
    error::{AppError, AppResult},
    modules::{
       applicant_profiles::handler::{
            get_by_id as get_applicant_profile_by_id,
            get_current as get_current_applicant_profile,
            get_for_employer_by_id as get_employer_visible_applicant_profile_by_id,
            patch_current as update_current_applicant_profile,
        },
        applications::handler::{
            create_application,
            list_employer_applications_for_opportunity,
            list_my_applications,
            update_application_status,
        },
        admin::handler::create_curator,
        curator::handler::{
            get_applicant_profile_by_id as curator_get_applicant_profile_by_id,
            get_employer_profile_by_id as curator_get_employer_profile_by_id,
            get_opportunity_by_id as curator_get_opportunity_by_id,
            get_verification_request_by_id,
            list_applicant_profiles,
            list_employer_profiles,
            list_opportunities as curator_list_opportunities,
            list_verification_requests,
            review_verification_request,
            update_applicant_profile_by_id as curator_update_applicant_profile_by_id,
            update_employer_profile_by_id as curator_update_employer_profile_by_id,
            update_opportunity_by_id as curator_update_opportunity_by_id,
        },
        employer_dashboard::handler::{
            create_current_verification_request,
            get_current_verification_request,
        },
        employer_profiles::handler::{get_current as get_current_employer_profile, patch_current as update_current_employer_profile},
        event_registrations::handler::{
            create_event_registration,
            delete_event_registration,
            list_my_event_registrations,
        },
        favorites::handler::{
            add_favorite_employer,
            add_favorite_opportunity,
            list_favorite_employers,
            list_favorite_opportunities,
            remove_favorite_employer,
            remove_favorite_opportunity,
        },
        me::handler::get_me,
        privacy_settings::handler::{
            get_my_privacy_settings,
            patch_my_privacy_settings,
        },
        opportunities::handler::{
            create_own_opportunity,
            get_public_opportunity_by_id,
            list_own_opportunities,
            list_public_opportunities,
            update_own_opportunity,
            update_own_opportunity_status,
        },
        tags::handler::list_tags,
        reference::handler::{list_addresses, list_cities},
        contacts::handler::{
            create_contact_request,
            list_contacts,
            patch_contact_status,
            get_career_interests,
        },
    },
    state::AppState,
};

pub fn api_router() -> Router<AppState> {
    Router::new()
        .route("/health", get(api_health))
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/refresh", post(refresh))
        .route("/auth/logout", post(logout))
        .route("/me", get(get_me))
        .route(
            "/applicant-profile/me",
            get(get_current_applicant_profile).patch(update_current_applicant_profile),
        )
        .route(
            "/applicant-profiles/{applicantProfileId}",
            get(get_applicant_profile_by_id),
        )
        .route(
            "/employer/applicant-profiles/{applicantProfileId}",
            get(get_employer_visible_applicant_profile_by_id),
        )
        .route(
            "/employer-profile/me",
            get(get_current_employer_profile).patch(update_current_employer_profile),
        )
        .route("/privacy-settings/me", get(get_my_privacy_settings).patch(patch_my_privacy_settings))
        .route(
            "/favorites/opportunities",
            get(list_favorite_opportunities),
        )
        .route("/favorites/opportunities/{id}", post(add_favorite_opportunity).delete(remove_favorite_opportunity))
        .route(
            "/favorites/employers",
            get(list_favorite_employers),
        )
        .route("/favorites/employers/{employerProfileId}", post(add_favorite_employer).delete(remove_favorite_employer))
        .route("/opportunities", get(list_public_opportunities).post(create_own_opportunity))
        .route(
            "/opportunities/{id}",
            get(get_public_opportunity_by_id).patch(update_own_opportunity),
        )
        .route("/opportunities/{id}/status", patch(update_own_opportunity_status))
        .route("/opportunities/{id}/applications", post(create_application))
        .route("/opportunities/{id}/event-registration", post(create_event_registration).delete(delete_event_registration))
        .route("/applications/me", get(list_my_applications))
        .route("/event-registrations/me", get(list_my_event_registrations))
        .route(
            "/employer/opportunities/{id}/applications",
            get(list_employer_applications_for_opportunity),
        )
        .route("/applications/{id}/status", patch(update_application_status))
        .route("/tags", get(list_tags).post(list_tags))
        .route("/reference/cities", get(list_cities))
        .route("/reference/addresses", get(list_addresses))
        .route(
            "/employer/verification-request",
            get(get_current_verification_request).post(create_current_verification_request),
        )
        .route("/employer/opportunities", get(list_own_opportunities))
        .route("/curator/verification-requests", get(list_verification_requests))
        .route(
            "/curator/verification-requests/{id}",
            get(get_verification_request_by_id).patch(review_verification_request),
        )
        .route("/curator/employer-profiles", get(list_employer_profiles))
        .route(
            "/curator/employer-profiles/{employerProfileId}",
            get(curator_get_employer_profile_by_id).patch(curator_update_employer_profile_by_id),
        )
        .route("/curator/applicant-profiles", get(list_applicant_profiles))
        .route(
            "/curator/applicant-profiles/{applicantProfileId}",
            get(curator_get_applicant_profile_by_id).patch(curator_update_applicant_profile_by_id),
        )
        .route("/curator/opportunities", get(curator_list_opportunities))
        .route(
            "/curator/opportunities/{id}",
            get(curator_get_opportunity_by_id).patch(curator_update_opportunity_by_id),
        )
        .route("/admin/curators", post(create_curator))
        .route("/contacts", get(list_contacts))
        .route("/contacts/requests", post(create_contact_request))
        .route("/contacts/{id}", patch(patch_contact_status))
        .route(
            "/contacts/applicant-profiles/{applicantProfileId}/career-interests",
            get(get_career_interests),
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
