use sqlx::PgPool;

use crate::models::{EmployerProfileRow};

pub async fn find_by_user_id(pool: &PgPool, user_id: i64) -> Result<Option<EmployerProfileRow>, sqlx::Error> {
    sqlx::query_as::<_, EmployerProfileRow>(
        r#"
        select
            id,
            user_id,
            company_name,
            short_description,
            industry,
            website_url,
            social_links,
            office_photos,
            promo_video_url,
            city_id,
            verification_status,
            verification_comment,
            verified_at,
            created_at,
            updated_at
        from employer_profiles
        where user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

#[allow(clippy::too_many_arguments)]
pub async fn update_profile(
    pool: &PgPool,
    user_id: i64,
    company_name: Option<&str>,
    short_description: Option<&str>,
    industry: Option<&str>,
    website_url: Option<&str>,
    social_links: &[String],
    office_photos: &[String],
    promo_video_url: Option<&str>,
    city_id: Option<i64>,
) -> Result<EmployerProfileRow, sqlx::Error> {
    sqlx::query_as::<_, EmployerProfileRow>(
        r#"
        update employer_profiles
        set
            company_name = $2,
            short_description = $3,
            industry = $4,
            website_url = $5,
            social_links = $6::jsonb,
            office_photos = $7::jsonb,
            promo_video_url = $8,
            city_id = $9
        where user_id = $1
        returning
            id,
            user_id,
            company_name,
            short_description,
            industry,
            website_url,
            social_links,
            office_photos,
            promo_video_url,
            city_id,
            verification_status,
            verification_comment,
            verified_at,
            created_at,
            updated_at
        "#,
    )
    .bind(user_id)
    .bind(company_name)
    .bind(short_description)
    .bind(industry)
    .bind(website_url)
    .bind(sqlx::types::Json(social_links.to_vec()))
    .bind(sqlx::types::Json(office_photos.to_vec()))
    .bind(promo_video_url)
    .bind(city_id)
    .fetch_one(pool)
    .await
}
