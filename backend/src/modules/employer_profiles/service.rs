use sqlx::PgPool;

use crate::{
    error::{AppError, AppResult},
    models::EmployerProfileRow,
};

use super::{dto::EmployerProfileUpdateRequest, repo};

pub async fn get_current_profile(pool: &PgPool, user_id: i64) -> AppResult<EmployerProfileRow> {
    repo::find_by_user_id(pool, user_id)
        .await?
        .ok_or_else(|| AppError::not_found("Employer profile not found"))
}

pub async fn update_current_profile(
    pool: &PgPool,
    user_id: i64,
    req: EmployerProfileUpdateRequest,
) -> AppResult<EmployerProfileRow> {
    let current = get_current_profile(pool, user_id).await?;

    let company_name = req.company_name.or(current.company_name).map(clean_non_empty);
    if company_name.as_deref().unwrap_or_default().is_empty() {
        return Err(AppError::bad_request("companyName must not be empty"));
    }

    let short_description = req.short_description.or(current.short_description).map(clean_nullable);
    let industry = req.industry.or(current.industry).map(clean_nullable);
    let website_url = req.website_url.or(current.website_url).map(clean_nullable);
    let promo_video_url = req.promo_video_url.or(current.promo_video_url).map(clean_nullable);
    let social_links = req
        .social_links
        .unwrap_or_else(|| json_value_to_vec_string(&current.social_links));

    let office_photos = req
        .office_photos
        .unwrap_or_else(|| json_value_to_vec_string(&current.office_photos));
    let city_id = req.city_id.or(current.city_id);

    repo::update_profile(
        pool,
        user_id,
        company_name.as_deref(),
        short_description.as_deref(),
        industry.as_deref(),
        website_url.as_deref(),
        &social_links,
        &office_photos,
        promo_video_url.as_deref(),
        city_id,
    )
    .await
    .map_err(AppError::from)
}

fn clean_non_empty(value: String) -> String {
    value.trim().to_string()
}

fn clean_nullable(value: String) -> String {
    value.trim().to_string()
}


fn json_value_to_vec_string(value: &serde_json::Value) -> Vec<String> {
    match value {
        serde_json::Value::Array(items) => items
            .iter()
            .filter_map(|v| v.as_str().map(ToOwned::to_owned))
            .collect(),
        _ => Vec::new(),
    }
}