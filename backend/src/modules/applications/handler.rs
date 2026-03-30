use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    Json,
};

use crate::{
    auth::{repo as auth_repo, token},
    error::{AppError, AppResult},
    models::UserRow,
    state::AppState,
};

use super::{
    dto::{
        ApplicationCreateRequest, ApplicationResponse, ApplicationStatusUpdateRequest,
        EmployerApplicationApplicantResponse, EmployerApplicationResponse,
        EmployerOpportunityApplicationsQuery, MyApplicationsQuery, PaginatedApplicationListResponse,
        PaginatedEmployerApplicationListResponse,
    },
    repo::EmployerApplicationRow,
    service,
};

pub async fn create_application(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(opportunity_id): Path<i64>,
    req: Option<Json<ApplicationCreateRequest>>,
) -> AppResult<(StatusCode, Json<ApplicationResponse>)> {
    let user = resolve_user(&state, &headers).await?;
    let created = service::create_application(&state.db, &user, opportunity_id, req.map(|Json(v)| v).unwrap_or_default()).await?;
    Ok((StatusCode::CREATED, Json(map_application(created))))
}

pub async fn list_my_applications(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<MyApplicationsQuery>,
) -> AppResult<Json<PaginatedApplicationListResponse>> {
    let user = resolve_user(&state, &headers).await?;
    let (rows, total) = service::list_my_applications(&state.db, &user, &query).await?;
    Ok(Json(PaginatedApplicationListResponse {
        items: rows.into_iter().map(map_application).collect(),
        page: query.page(),
        per_page: query.per_page(),
        total,
    }))
}

pub async fn list_employer_applications_for_opportunity(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(opportunity_id): Path<i64>,
    Query(query): Query<EmployerOpportunityApplicationsQuery>,
) -> AppResult<Json<PaginatedEmployerApplicationListResponse>> {
    let user = resolve_user(&state, &headers).await?;
    let (rows, total) = service::list_employer_applications_for_opportunity(&state.db, &user, opportunity_id, &query).await?;
    Ok(Json(PaginatedEmployerApplicationListResponse {
        items: rows.into_iter().map(map_employer_application).collect(),
        page: query.page(),
        per_page: query.per_page(),
        total,
    }))
}

pub async fn update_application_status(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(application_id): Path<i64>,
    Json(req): Json<ApplicationStatusUpdateRequest>,
) -> AppResult<Json<ApplicationResponse>> {
    let user = resolve_user(&state, &headers).await?;
    let updated = service::update_application_status(&state.db, &user, application_id, req).await?;
    Ok(Json(map_application(updated)))
}

fn map_application(row: crate::models::ApplicationRow) -> ApplicationResponse {
    ApplicationResponse {
        id: row.id,
        opportunity_id: row.opportunity_id,
        applicant_profile_id: row.applicant_profile_id,
        status: row.status,
        cover_letter: row.cover_letter,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }
}

fn map_employer_application(row: EmployerApplicationRow) -> EmployerApplicationResponse {
    EmployerApplicationResponse {
        id: row.id,
        opportunity_id: row.opportunity_id,
        applicant_profile_id: row.applicant_profile_id,
        status: row.status,
        cover_letter: row.cover_letter,
        created_at: row.created_at,
        updated_at: row.updated_at,
        applicant: EmployerApplicationApplicantResponse {
            id: row.applicant_id,
            full_name: row.applicant_full_name,
            university: row.applicant_university,
            study_course: row.applicant_study_course,
            graduation_year: row.applicant_graduation_year,
            about: row.applicant_about,
        },
    }
}

async fn resolve_user(state: &AppState, headers: &HeaderMap) -> AppResult<UserRow> {
    let raw_token = extract_bearer_token(headers)?;
    let claims = token::decode_access_token(raw_token, &state.settings.auth)?;
    auth_repo::find_user_by_id(&state.db, claims.sub)
        .await?
        .ok_or_else(|| AppError::unauthorized("User not found"))
}

fn extract_bearer_token(headers: &HeaderMap) -> AppResult<&str> {
    let raw = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| AppError::unauthorized("Missing Authorization header"))?;

    raw.strip_prefix("Bearer ")
        .ok_or_else(|| AppError::unauthorized("Invalid Authorization header"))
}
