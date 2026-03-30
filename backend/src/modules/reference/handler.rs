use axum::{
    extract::{Query, State},
    Json,
};

use crate::{error::AppResult, state::AppState};

use super::{
    dto::{AddressListQuery, AddressReferenceResponse, CityReferenceResponse},
    service,
};

pub async fn list_cities(State(state): State<AppState>) -> AppResult<Json<Vec<CityReferenceResponse>>> {
    let rows = service::list_cities(&state.db).await?;

    let response = rows
        .into_iter()
        .map(|row| CityReferenceResponse {
            id: row.id,
            city_name: row.city_name,
            country: row.country,
            region: row.region,
            latitude: row.latitude,
            longitude: row.longitude,
        })
        .collect();

    Ok(Json(response))
}

pub async fn list_addresses(
    State(state): State<AppState>,
    Query(query): Query<AddressListQuery>,
) -> AppResult<Json<Vec<AddressReferenceResponse>>> {
    let rows = service::list_addresses(&state.db, query.city_id).await?;

    let response = rows
        .into_iter()
        .map(|row| AddressReferenceResponse {
            id: row.id,
            city_id: row.city_id,
            city_name: row.city_name,
            full_address: row.full_address,
            latitude: row.latitude,
            longitude: row.longitude,
        })
        .collect();

    Ok(Json(response))
}
