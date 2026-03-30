use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    Json,
};

use crate::{
    auth::{repo as auth_repo, token},
    error::{AppError, AppResult},
    state::AppState,
};

use super::{
    dto::{
        EmployerOwnOpportunityListQuery, OpportunityCreateRequest, OpportunityDetailsResponse,
        OpportunityListQuery, OpportunityStatusUpdateRequest, OpportunitySummaryResponse,
        OpportunityUpdateRequest, PaginatedOpportunityListResponse,
    },
    repo, service,
};

pub async fn list_public_opportunities(
    State(state): State<AppState>,
    Query(query): Query<OpportunityListQuery>,
) -> AppResult<Json<PaginatedOpportunityListResponse>> {
    let tag_ids = query.parsed_tag_ids().map_err(AppError::bad_request)?;
    let (rows, total) = repo::list_public_opportunities(&state.db, &query, &tag_ids).await?;
    Ok(Json(PaginatedOpportunityListResponse {
        items: rows.into_iter().map(map_summary).collect(),
        page: query.page(),
        per_page: query.per_page(),
        total,
    }))
}

pub async fn list_own_opportunities(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<EmployerOwnOpportunityListQuery>,
) -> AppResult<Json<PaginatedOpportunityListResponse>> {
    let user_id = resolve_user_id(&state, &headers).await?;
    let (rows, total) = repo::list_own_opportunities(&state.db, user_id, &query).await?;
    Ok(Json(PaginatedOpportunityListResponse {
        items: rows.into_iter().map(map_summary).collect(),
        page: query.page(),
        per_page: query.per_page(),
        total,
    }))
}

pub async fn get_public_opportunity_by_id(
    State(state): State<AppState>,
    Path(opportunity_id): Path<i64>,
) -> AppResult<Json<OpportunityDetailsResponse>> {
    let row = repo::get_public_opportunity_by_id(&state.db, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found"))?;
    Ok(Json(map_details(row)))
}

pub async fn create_own_opportunity(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<OpportunityCreateRequest>,
) -> AppResult<(StatusCode, Json<OpportunityDetailsResponse>)> {
    let user_id = resolve_user_id(&state, &headers).await?;
    let row = service::create_own_opportunity(&state.db, user_id, req).await?;
    Ok((StatusCode::CREATED, Json(map_details(row))))
}

pub async fn update_own_opportunity(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(opportunity_id): Path<i64>,
    Json(req): Json<OpportunityUpdateRequest>,
) -> AppResult<Json<OpportunityDetailsResponse>> {
    let user_id = resolve_user_id(&state, &headers).await?;
    let row = service::update_own_opportunity(&state.db, user_id, opportunity_id, req).await?;
    Ok(Json(map_details(row)))
}

pub async fn update_own_opportunity_status(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(opportunity_id): Path<i64>,
    Json(req): Json<OpportunityStatusUpdateRequest>,
) -> AppResult<Json<OpportunityDetailsResponse>> {
    let user_id = resolve_user_id(&state, &headers).await?;
    let row = service::update_own_opportunity_status(&state.db, user_id, opportunity_id, req).await?;
    Ok(Json(map_details(row)))
}

fn map_summary(row: repo::OpportunitySummaryRow) -> OpportunitySummaryResponse {
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
        event_date: row.event_date,
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

fn map_details(row: repo::OpportunityDetailsRow) -> OpportunityDetailsResponse {
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

async fn resolve_user_id(state: &AppState, headers: &HeaderMap) -> AppResult<i64> {
    let raw_token = extract_bearer_token(headers)?;
    let claims = token::decode_access_token(raw_token, &state.settings.auth)?;
    let user = auth_repo::find_user_by_id(&state.db, claims.sub)
        .await?
        .ok_or_else(|| AppError::unauthorized("User not found"))?;

    if !user.is_active {
        return Err(AppError::forbidden("User is inactive"));
    }

    Ok(user.id)
}

fn extract_bearer_token(headers: &HeaderMap) -> AppResult<&str> {
    let raw = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| AppError::unauthorized("Missing Authorization header"))?;

    raw.strip_prefix("Bearer ")
        .ok_or_else(|| AppError::unauthorized("Invalid Authorization header"))
}
