use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::{
    error::AppResult,
    http::middleware::{require_any_role, require_auth_user},
    models::AppRole,
    modules::{
        applicant_profiles::dto::ApplicantProfileResponse,
        employer_profiles::dto::EmployerProfileResponse,
        opportunities::dto::{OpportunityDetailsResponse, OpportunitySummaryResponse},
    },
    state::AppState,
};

use super::{dto::{
    map_verification_request_response,
    CuratorApplicantProfileUpdateRequest,
    CuratorApplicantProfilesQuery,
    CuratorEmployerProfileUpdateRequest,
    CuratorEmployerProfilesQuery,
    CuratorOpportunitiesQuery,
    CuratorOpportunityUpdateRequest,
    PaginatedApplicantProfilesResponse,
    PaginatedEmployerProfilesResponse,
    PaginatedOpportunitiesResponse,
    VerificationRequestResponse,
    VerificationRequestUpdateRequest,
}, service};

pub async fn list_verification_requests(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> AppResult<Json<Vec<VerificationRequestResponse>>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    require_any_role(auth_user, &[AppRole::Curator, AppRole::AdminCurator])?;

    let items = service::list_verification_requests(&state.db)
        .await?
        .into_iter()
        .map(map_verification_request_response)
        .collect();
    Ok(Json(items))
}


pub async fn get_verification_request_by_id(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(verification_request_id): Path<i64>,
) -> AppResult<Json<VerificationRequestResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    require_any_role(auth_user, &[AppRole::Curator, AppRole::AdminCurator])?;
    let row = service::get_verification_request_by_id(&state.db, verification_request_id).await?;
    Ok(Json(map_verification_request_response(row)))
}

pub async fn review_verification_request(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(verification_request_id): Path<i64>,
    Json(req): Json<VerificationRequestUpdateRequest>,
) -> AppResult<Json<VerificationRequestResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let row = service::review_verification_request(
        &state.db,
        auth_user.role,
        auth_user.id,
        verification_request_id,
        req,
    )
    .await?;
    Ok(Json(map_verification_request_response(row)))
}

pub async fn list_employer_profiles(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<CuratorEmployerProfilesQuery>,
) -> AppResult<Json<PaginatedEmployerProfilesResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let (rows, total) = service::list_employer_profiles(&state.db, auth_user.role, &query).await?;
    Ok(Json(PaginatedEmployerProfilesResponse {
        items: rows.into_iter().map(EmployerProfileResponse::from).collect(),
        page: query.page(),
        per_page: query.per_page(),
        total,
    }))
}

pub async fn get_employer_profile_by_id(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(employer_profile_id): Path<i64>,
) -> AppResult<Json<EmployerProfileResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let row = service::get_employer_profile_by_id(&state.db, auth_user.role, employer_profile_id).await?;
    Ok(Json(EmployerProfileResponse::from(row)))
}

pub async fn update_employer_profile_by_id(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(employer_profile_id): Path<i64>,
    Json(req): Json<CuratorEmployerProfileUpdateRequest>,
) -> AppResult<Json<EmployerProfileResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let row = service::update_employer_profile_by_id(&state.db, auth_user.role, employer_profile_id, req).await?;
    Ok(Json(EmployerProfileResponse::from(row)))
}

pub async fn list_applicant_profiles(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<CuratorApplicantProfilesQuery>,
) -> AppResult<Json<PaginatedApplicantProfilesResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let (rows, total) = service::list_applicant_profiles(&state.db, auth_user.role, &query).await?;
    Ok(Json(PaginatedApplicantProfilesResponse {
        items: rows.into_iter().map(ApplicantProfileResponse::from).collect(),
        page: query.page(),
        per_page: query.per_page(),
        total,
    }))
}

pub async fn get_applicant_profile_by_id(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(applicant_profile_id): Path<i64>,
) -> AppResult<Json<ApplicantProfileResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let row = service::get_applicant_profile_by_id(&state.db, auth_user.role, applicant_profile_id).await?;
    Ok(Json(ApplicantProfileResponse::from(row)))
}

pub async fn update_applicant_profile_by_id(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(applicant_profile_id): Path<i64>,
    Json(req): Json<CuratorApplicantProfileUpdateRequest>,
) -> AppResult<Json<ApplicantProfileResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let row = service::update_applicant_profile_by_id(&state.db, auth_user.role, applicant_profile_id, req).await?;
    Ok(Json(ApplicantProfileResponse::from(row)))
}

pub async fn list_opportunities(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<CuratorOpportunitiesQuery>,
) -> AppResult<Json<PaginatedOpportunitiesResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let (rows, total) = service::list_opportunities(&state.db, auth_user.role, &query).await?;
    Ok(Json(PaginatedOpportunitiesResponse {
        items: rows.into_iter().map(map_summary).collect(),
        page: query.page(),
        per_page: query.per_page(),
        total,
    }))
}

pub async fn get_opportunity_by_id(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(opportunity_id): Path<i64>,
) -> AppResult<Json<OpportunityDetailsResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let row = service::get_opportunity_by_id(&state.db, auth_user.role, opportunity_id).await?;
    Ok(Json(map_details(row)))
}

pub async fn update_opportunity_by_id(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(opportunity_id): Path<i64>,
    Json(req): Json<CuratorOpportunityUpdateRequest>,
) -> AppResult<Json<OpportunityDetailsResponse>> {
    let auth_user = require_auth_user(&state, &headers).await?;
    let row = service::update_opportunity_by_id(&state.db, auth_user.role, opportunity_id, req).await?;
    Ok(Json(map_details(row)))
}

fn map_summary(row: crate::modules::opportunities::repo::OpportunitySummaryRow) -> OpportunitySummaryResponse {
    OpportunitySummaryResponse {
        id: row.id,
        title: row.title,
        short_description: row.short_description,
        employer_profile_id: row.employer_profile_id,
        employer_name: row.employer_name,
        opportunity_type: row.opportunity_type,
        work_format: row.work_format,
        publication_status: row.publication_status,
        city_id: row.city_id,
        address_id: row.address_id,
        salary_from: row.salary_from,
        salary_to: row.salary_to,
        tag_ids: row.tag_ids,
        city_name: row.city_name,
        address_text: row.address_text,
        latitude: row.latitude,
        longitude: row.longitude,
        is_favorite: None,
    }
}

fn map_details(row: crate::modules::opportunities::repo::OpportunityDetailsRow) -> OpportunityDetailsResponse {
    OpportunityDetailsResponse {
        id: row.id,
        title: row.title,
        short_description: row.short_description,
        employer_profile_id: row.employer_profile_id,
        employer_name: row.employer_name,
        opportunity_type: row.opportunity_type,
        work_format: row.work_format,
        publication_status: row.publication_status,
        city_id: row.city_id,
        address_id: row.address_id,
        salary_from: row.salary_from,
        salary_to: row.salary_to,
        tag_ids: row.tag_ids,
        city_name: row.city_name,
        address_text: row.address_text,
        latitude: row.latitude,
        longitude: row.longitude,
        is_favorite: None,
        full_description: row.full_description,
        employment_type: row.employment_type,
        level: row.level,
        published_at: row.published_at,
        expires_at: row.expires_at,
        event_date: row.event_date,
        contact_info: row.contact_info,
        resource_links: json_array_to_strings(row.resource_links),
        media: json_array_to_strings(row.media),
    }
}

fn json_array_to_strings(value: serde_json::Value) -> Vec<String> {
    value
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.as_str().map(ToOwned::to_owned))
                .collect()
        })
        .unwrap_or_default()
}
