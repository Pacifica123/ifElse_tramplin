use sqlx::PgPool;

use crate::{
    error::AppResult,
    modules::{
        employer_profiles::dto::EmployerProfileResponse,
        opportunities::dto::OpportunitySummaryResponse,
        opportunities::repo::OpportunitySummaryRow,
    },
};

use super::repo;

pub async fn list_favorite_opportunities(
    pool: &PgPool,
    user_id: i64,
) -> AppResult<Vec<OpportunitySummaryResponse>> {
    let rows = repo::list_favorite_opportunities(pool, user_id).await?;
    Ok(rows.into_iter().map(map_summary).collect())
}

pub async fn list_favorite_employers(
    pool: &PgPool,
    user_id: i64,
) -> AppResult<Vec<EmployerProfileResponse>> {
    let rows = repo::list_favorite_employers(pool, user_id).await?;
    Ok(rows.into_iter().map(EmployerProfileResponse::from).collect())
}

pub async fn add_favorite_opportunity(
    pool: &PgPool,
    user_id: i64,
    opportunity_id: i64,
) -> AppResult<()> {
    repo::add_favorite_opportunity(pool, user_id, opportunity_id).await?;
    Ok(())
}

pub async fn remove_favorite_opportunity(
    pool: &PgPool,
    user_id: i64,
    opportunity_id: i64,
) -> AppResult<()> {
    repo::remove_favorite_opportunity(pool, user_id, opportunity_id).await?;
    Ok(())
}

pub async fn add_favorite_employer(
    pool: &PgPool,
    user_id: i64,
    employer_profile_id: i64,
) -> AppResult<()> {
    repo::add_favorite_employer(pool, user_id, employer_profile_id).await?;
    Ok(())
}

pub async fn remove_favorite_employer(
    pool: &PgPool,
    user_id: i64,
    employer_profile_id: i64,
) -> AppResult<()> {
    repo::remove_favorite_employer(pool, user_id, employer_profile_id).await?;
    Ok(())
}

fn map_summary(row: OpportunitySummaryRow) -> OpportunitySummaryResponse {
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
        is_favorite: Some(true),
    }
}