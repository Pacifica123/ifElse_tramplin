use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    Json,
};

use crate::{
    auth::{repo as auth_repo, token},
    error::{AppError, AppResult},
    models::{EventRegistrationRow, UserRow},
    modules::opportunities::dto::OpportunitySummaryResponse,
    state::AppState,
};

use super::{
    dto::{
        EventRegistrationListItemResponse, EventRegistrationResponse,
        PaginatedEventRegistrationListResponse, EventRegistrationListQuery,
    },
    repo::EventRegistrationListItemRow,
    service,
};

pub async fn create_event_registration(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(opportunity_id): Path<i64>,
) -> AppResult<(StatusCode, Json<EventRegistrationResponse>)> {
    let user = resolve_user(&state, &headers).await?;
    let created = service::register_for_event(&state.db, &user, opportunity_id).await?;
    Ok((StatusCode::CREATED, Json(map_registration(created))))
}

pub async fn delete_event_registration(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(opportunity_id): Path<i64>,
) -> AppResult<StatusCode> {
    let user = resolve_user(&state, &headers).await?;
    service::cancel_event_registration(&state.db, &user, opportunity_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_my_event_registrations(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<EventRegistrationListQuery>,
) -> AppResult<Json<PaginatedEventRegistrationListResponse>> {
    let user = resolve_user(&state, &headers).await?;
    let (rows, total) = service::list_my_event_registrations(&state.db, &user, &query).await?;
    Ok(Json(PaginatedEventRegistrationListResponse {
        items: rows.into_iter().map(map_list_item).collect(),
        page: query.page(),
        per_page: query.per_page(),
        total,
    }))
}

fn map_registration(row: EventRegistrationRow) -> EventRegistrationResponse {
    EventRegistrationResponse {
        id: row.id,
        opportunity_id: row.opportunity_id,
        applicant_profile_id: row.applicant_profile_id,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        cancelled_at: row.cancelled_at,
    }
}

fn map_list_item(row: EventRegistrationListItemRow) -> EventRegistrationListItemResponse {
    EventRegistrationListItemResponse {
        registration: EventRegistrationResponse {
            id: row.registration_id,
            opportunity_id: row.registration_opportunity_id,
            applicant_profile_id: row.registration_applicant_profile_id,
            status: row.registration_status,
            created_at: row.registration_created_at,
            updated_at: row.registration_updated_at,
            cancelled_at: row.registration_cancelled_at,
        },
        opportunity: OpportunitySummaryResponse {
            id: row.opportunity_id,
            title: row.opportunity_title,
            short_description: row.opportunity_short_description,
            employer_profile_id: row.opportunity_employer_profile_id,
            employer_name: row.opportunity_employer_name,
            opportunity_type: row.opportunity_opportunity_type,
            work_format: row.opportunity_work_format,
            publication_status: row.opportunity_publication_status,
            city_id: row.opportunity_city_id,
            address_id: row.opportunity_address_id,
            event_date: row.opportunity_event_date,
            salary_from: row.opportunity_salary_from,
            salary_to: row.opportunity_salary_to,
            tag_ids: row.opportunity_tag_ids,
            city_name: row.opportunity_city_name,
            address_text: row.opportunity_address_text,
            latitude: row.opportunity_latitude,
            longitude: row.opportunity_longitude,
            is_favorite: None,
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
