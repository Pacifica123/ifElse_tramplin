use axum::{
    extract::State,
    http::{header, HeaderMap, StatusCode},
    Json,
};

use crate::{
    auth::{repo as auth_repo, token},
    error::{AppError, AppResult},
    models::{AppRole, UserRow},
    state::AppState,
};

use super::{dto::{TagCreateRequest, TagResponse}, repo};

pub async fn list_tags(State(state): State<AppState>) -> AppResult<Json<Vec<TagResponse>>> {
    let rows = repo::list_active_tags(&state.db).await?;

    let response = rows
        .into_iter()
        .map(|row| TagResponse {
            id: row.id,
            name: row.name,
            tag_type: row.tag_type,
            is_system: row.is_system,
            is_active: row.is_active,
        })
        .collect();

    Ok(Json(response))
}

pub async fn create_tag(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<TagCreateRequest>,
) -> AppResult<(StatusCode, Json<TagResponse>)> {
    let user = require_auth_user(&state, &headers).await?;

    match user.role {
        AppRole::Employer | AppRole::Curator | AppRole::AdminCurator => {}
        _ => return Err(AppError::forbidden("Only employers and curators can create tags")),
    }

    let name = req.name.trim();
    if name.is_empty() {
        return Err(AppError::bad_request("name must not be empty"));
    }

    let row = repo::insert_tag(&state.db, name, req.tag_type, user.id)
        .await
        .map_err(map_insert_error)?;

    Ok((
        StatusCode::CREATED,
        Json(TagResponse {
            id: row.id,
            name: row.name,
            tag_type: row.tag_type,
            is_system: row.is_system,
            is_active: row.is_active,
        }),
    ))
}

async fn require_auth_user(state: &AppState, headers: &HeaderMap) -> AppResult<UserRow> {
    let raw_token = extract_bearer_token(headers)?;
    let claims = token::decode_access_token(raw_token, &state.settings.auth)?;
    let user = auth_repo::find_user_by_id(&state.db, claims.sub)
        .await?
        .ok_or_else(|| AppError::unauthorized("User not found"))?;

    if !user.is_active {
        return Err(AppError::forbidden("User is inactive"));
    }

    Ok(user)
}

fn extract_bearer_token(headers: &HeaderMap) -> AppResult<&str> {
    let raw = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| AppError::unauthorized("Missing Authorization header"))?;

    raw.strip_prefix("Bearer ")
        .ok_or_else(|| AppError::unauthorized("Invalid Authorization header"))
}

fn map_insert_error(err: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(db_err) = &err {
        if db_err.code().as_deref() == Some("23505") {
            return AppError::conflict("Tag with this name and type already exists");
        }
    }

    AppError::from(err)
}
