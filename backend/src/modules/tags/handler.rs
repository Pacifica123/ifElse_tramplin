use axum::{extract::State, Json};

use crate::{error::AppResult, state::AppState};

use super::{dto::TagResponse, repo};

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
