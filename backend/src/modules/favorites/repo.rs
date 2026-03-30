use sqlx::PgPool;

use crate::{
    models::EmployerProfileRow,
    modules::opportunities::repo::OpportunitySummaryRow,
};

pub async fn list_favorite_opportunities(
    pool: &PgPool,
    user_id: i64,
) -> Result<Vec<OpportunitySummaryRow>, sqlx::Error> {
    sqlx::query_as::<_, OpportunitySummaryRow>(
        r#"
        select
            o.id,
            o.title,
            o.short_description,
            o.employer_profile_id,
            ep.company_name as employer_name,
            o.opportunity_type,
            o.work_format,
            o.publication_status,
            o.city_id,
            o.address_id,
            o.event_date,
            o.salary_from,
            o.salary_to,
            coalesce((
                select array_agg(ot.tag_id order by ot.tag_id)
                from opportunity_tags ot
                where ot.opportunity_id = o.id
            ), '{}'::bigint[]) as tag_ids,
            coalesce(c.city_name, ac.city_name) as city_name,
            a.full_address as address_text,
            coalesce(c.latitude, a.latitude) as latitude,
            coalesce(c.longitude, a.longitude) as longitude
        from favorite_opportunities fo
        join opportunities o on o.id = fo.opportunity_id
        left join employer_profiles ep on ep.id = o.employer_profile_id
        left join cities c on c.id = o.city_id
        left join addresses a on a.id = o.address_id
        left join cities ac on ac.id = a.city_id
        where fo.user_id = $1
        order by fo.created_at desc, o.id desc
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn list_favorite_employers(
    pool: &PgPool,
    user_id: i64,
) -> Result<Vec<EmployerProfileRow>, sqlx::Error> {
    sqlx::query_as::<_, EmployerProfileRow>(
        r#"
        select
            ep.id,
            ep.user_id,
            ep.company_name,
            ep.short_description,
            ep.industry,
            ep.website_url,
            ep.social_links,
            ep.office_photos,
            ep.promo_video_url,
            ep.city_id,
            ep.verification_status,
            ep.verification_comment,
            ep.verified_at,
            ep.created_at,
            ep.updated_at
        from favorite_employers fe
        join employer_profiles ep on ep.id = fe.employer_profile_id
        where fe.user_id = $1
        order by fe.created_at desc, ep.id desc
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn add_favorite_opportunity(
    pool: &PgPool,
    user_id: i64,
    opportunity_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        insert into favorite_opportunities (user_id, opportunity_id)
        values ($1, $2)
        on conflict (user_id, opportunity_id) do nothing
        "#,
    )
    .bind(user_id)
    .bind(opportunity_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn remove_favorite_opportunity(
    pool: &PgPool,
    user_id: i64,
    opportunity_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        delete from favorite_opportunities
        where user_id = $1 and opportunity_id = $2
        "#,
    )
    .bind(user_id)
    .bind(opportunity_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn add_favorite_employer(
    pool: &PgPool,
    user_id: i64,
    employer_profile_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        insert into favorite_employers (user_id, employer_profile_id)
        values ($1, $2)
        on conflict (user_id, employer_profile_id) do nothing
        "#,
    )
    .bind(user_id)
    .bind(employer_profile_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn remove_favorite_employer(
    pool: &PgPool,
    user_id: i64,
    employer_profile_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        delete from favorite_employers
        where user_id = $1 and employer_profile_id = $2
        "#,
    )
    .bind(user_id)
    .bind(employer_profile_id)
    .execute(pool)
    .await?;
    Ok(())
}