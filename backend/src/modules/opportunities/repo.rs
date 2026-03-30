use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::{FromRow, PgPool, Postgres, QueryBuilder, Transaction};

use crate::models::{EmploymentType, Level, OpportunityType, PublicationStatus, WorkFormat};

use super::dto::{EmployerOwnOpportunityListQuery, OpportunityListQuery};

#[derive(Debug, Clone, FromRow)]
pub struct OpportunitySummaryRow {
    pub id: i64,
    pub title: String,
    pub short_description: Option<String>,
    pub employer_profile_id: i64,
    pub employer_name: Option<String>,
    pub opportunity_type: OpportunityType,
    pub work_format: WorkFormat,
    pub publication_status: PublicationStatus,
    pub city_id: Option<i64>,
    pub address_id: Option<i64>,
    pub salary_from: Option<i32>,
    pub salary_to: Option<i32>,
    pub tag_ids: Vec<i64>,
    pub city_name: Option<String>,
    pub address_text: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub event_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct OpportunityDetailsRow {
    pub id: i64,
    pub title: String,
    pub short_description: Option<String>,
    pub employer_profile_id: i64,
    pub employer_name: Option<String>,
    pub opportunity_type: OpportunityType,
    pub work_format: WorkFormat,
    pub publication_status: PublicationStatus,
    pub city_id: Option<i64>,
    pub address_id: Option<i64>,
    pub salary_from: Option<i32>,
    pub salary_to: Option<i32>,
    pub tag_ids: Vec<i64>,
    pub city_name: Option<String>,
    pub address_text: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub full_description: Option<String>,
    pub employment_type: Option<EmploymentType>,
    pub level: Option<Level>,
    pub published_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub event_date: Option<DateTime<Utc>>,
    pub contact_info: Value,
    pub resource_links: Value,
    pub media: Value,
}

#[allow(clippy::too_many_arguments)]
#[derive(Debug, Clone)]
pub struct OpportunityWritePayload {
    pub title: String,
    pub short_description: String,
    pub full_description: String,
    pub opportunity_type: OpportunityType,
    pub work_format: WorkFormat,
    pub employment_type: Option<EmploymentType>,
    pub level: Option<Level>,
    pub city_id: Option<i64>,
    pub address_id: Option<i64>,
    pub salary_from: Option<i32>,
    pub salary_to: Option<i32>,
    pub published_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub event_date: Option<DateTime<Utc>>,
    pub contact_info: Value,
    pub resource_links: Vec<String>,
    pub media: Vec<String>,
}

pub async fn list_public_opportunities(
    pool: &PgPool,
    query: &OpportunityListQuery,
    tag_ids: &[i64],
) -> Result<(Vec<OpportunitySummaryRow>, i64), sqlx::Error> {
    let page = query.page();
    let per_page = query.per_page();
    let offset = (page - 1) * per_page;

    let mut count_builder = base_query_builder(true);
    append_public_filters(&mut count_builder, query, tag_ids);
    let total: i64 = count_builder.build_query_scalar().fetch_one(pool).await?;

    let mut builder = base_query_builder(false);
    append_public_filters(&mut builder, query, tag_ids);
    builder.push(" order by coalesce(o.published_at, o.created_at) desc, o.id desc ");
    builder.push(" limit ");
    builder.push_bind(per_page);
    builder.push(" offset ");
    builder.push_bind(offset);

    let items = builder.build_query_as::<OpportunitySummaryRow>().fetch_all(pool).await?;
    Ok((items, total))
}

pub async fn list_own_opportunities(
    pool: &PgPool,
    user_id: i64,
    query: &EmployerOwnOpportunityListQuery,
) -> Result<(Vec<OpportunitySummaryRow>, i64), sqlx::Error> {
    let page = query.page();
    let per_page = query.per_page();
    let offset = (page - 1) * per_page;

    let mut count_builder = own_query_builder(true);
    append_own_filters(&mut count_builder, user_id, query);
    let total: i64 = count_builder.build_query_scalar().fetch_one(pool).await?;

    let mut builder = own_query_builder(false);
    append_own_filters(&mut builder, user_id, query);
    builder.push(" order by o.updated_at desc, o.id desc ");
    builder.push(" limit ");
    builder.push_bind(per_page);
    builder.push(" offset ");
    builder.push_bind(offset);

    let items = builder.build_query_as::<OpportunitySummaryRow>().fetch_all(pool).await?;
    Ok((items, total))
}

pub async fn get_public_opportunity_by_id(
    pool: &PgPool,
    opportunity_id: i64,
) -> Result<Option<OpportunityDetailsRow>, sqlx::Error> {
    sqlx::query_as::<_, OpportunityDetailsRow>(public_details_sql())
        .bind(opportunity_id)
        .fetch_optional(pool)
        .await
}

pub async fn get_own_opportunity_by_id(
    pool: &PgPool,
    user_id: i64,
    opportunity_id: i64,
) -> Result<Option<OpportunityDetailsRow>, sqlx::Error> {
    sqlx::query_as::<_, OpportunityDetailsRow>(own_details_sql())
        .bind(opportunity_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await
}

pub async fn all_tag_ids_exist(pool: &PgPool, tag_ids: &[i64]) -> Result<bool, sqlx::Error> {
    if tag_ids.is_empty() {
        return Ok(false);
    }

    let count: i64 = sqlx::query_scalar(
        r#"
        select count(*)::bigint
        from tags
        where id = any($1)
          and is_active = true
        "#,
    )
    .bind(tag_ids)
    .fetch_one(pool)
    .await?;

    Ok(count == tag_ids.len() as i64)
}

pub async fn insert_opportunity(
    tx: &mut Transaction<'_, Postgres>,
    employer_profile_id: i64,
    payload: &OpportunityWritePayload,
) -> Result<i64, sqlx::Error> {
    let opportunity_id: i64 = sqlx::query_scalar(
        r#"
        insert into opportunities (
            employer_profile_id,
            title,
            short_description,
            full_description,
            opportunity_type,
            work_format,
            employment_type,
            level,
            city_id,
            address_id,
            salary_from,
            salary_to,
            published_at,
            expires_at,
            event_date,
            contact_info,
            resource_links,
            media
        )
        values (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18
        )
        returning id
        "#,
    )
    .bind(employer_profile_id)
    .bind(&payload.title)
    .bind(&payload.short_description)
    .bind(&payload.full_description)
    .bind(payload.opportunity_type)
    .bind(payload.work_format)
    .bind(payload.employment_type)
    .bind(payload.level)
    .bind(payload.city_id)
    .bind(payload.address_id)
    .bind(payload.salary_from)
    .bind(payload.salary_to)
    .bind(payload.published_at)
    .bind(payload.expires_at)
    .bind(payload.event_date)
    .bind(&payload.contact_info)
    .bind(sqlx::types::Json(payload.resource_links.clone()))
    .bind(sqlx::types::Json(payload.media.clone()))
    .fetch_one(&mut **tx)
    .await?;

    Ok(opportunity_id)
}

pub async fn update_opportunity(
    tx: &mut Transaction<'_, Postgres>,
    opportunity_id: i64,
    payload: &OpportunityWritePayload,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        update opportunities
        set
            title = $2,
            short_description = $3,
            full_description = $4,
            work_format = $5,
            employment_type = $6,
            level = $7,
            city_id = $8,
            address_id = $9,
            salary_from = $10,
            salary_to = $11,
            published_at = $12,
            expires_at = $13,
            event_date = $14,
            contact_info = $15,
            resource_links = $16::jsonb,
            media = $17::jsonb
        where id = $1
        "#,
    )
    .bind(opportunity_id)
    .bind(&payload.title)
    .bind(&payload.short_description)
    .bind(&payload.full_description)
    .bind(payload.work_format)
    .bind(payload.employment_type)
    .bind(payload.level)
    .bind(payload.city_id)
    .bind(payload.address_id)
    .bind(payload.salary_from)
    .bind(payload.salary_to)
    .bind(payload.published_at)
    .bind(payload.expires_at)
    .bind(payload.event_date)
    .bind(&payload.contact_info)
    .bind(sqlx::types::Json(payload.resource_links.clone()))
    .bind(sqlx::types::Json(payload.media.clone()))
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn replace_opportunity_tags(
    tx: &mut Transaction<'_, Postgres>,
    opportunity_id: i64,
    tag_ids: &[i64],
) -> Result<(), sqlx::Error> {
    sqlx::query("delete from opportunity_tags where opportunity_id = $1")
        .bind(opportunity_id)
        .execute(&mut **tx)
        .await?;

    for tag_id in tag_ids.iter().copied() {
        sqlx::query(
            r#"
            insert into opportunity_tags (opportunity_id, tag_id)
            values ($1, $2)
            "#,
        )
        .bind(opportunity_id)
        .bind(tag_id)
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}

pub async fn update_opportunity_status(
    pool: &PgPool,
    opportunity_id: i64,
    status: PublicationStatus,
    published_at: Option<DateTime<Utc>>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        update opportunities
        set
            publication_status = $2,
            published_at = $3
        where id = $1
        "#,
    )
    .bind(opportunity_id)
    .bind(status)
    .bind(published_at)
    .execute(pool)
    .await?;

    Ok(())
}

fn base_query_builder(count_only: bool) -> QueryBuilder<'static, Postgres> {
    if count_only {
        QueryBuilder::<Postgres>::new(
            r#"
            select count(*) as total
            from opportunities o
            left join employer_profiles ep on ep.id = o.employer_profile_id
            left join cities c on c.id = o.city_id
            left join addresses a on a.id = o.address_id
            left join cities ac on ac.id = a.city_id
            where o.publication_status = 'active'
            "#,
        )
    } else {
        QueryBuilder::<Postgres>::new(summary_select_sql("where o.publication_status = 'active'"))
    }
}

fn own_query_builder(count_only: bool) -> QueryBuilder<'static, Postgres> {
    if count_only {
        QueryBuilder::<Postgres>::new(
            r#"
            select count(*) as total
            from opportunities o
            join employer_profiles ep on ep.id = o.employer_profile_id
            left join addresses a on a.id = o.address_id
            where 1 = 1
            "#,
        )
    } else {
        QueryBuilder::<Postgres>::new(summary_select_sql("where 1 = 1"))
    }
}

fn append_public_filters(
    builder: &mut QueryBuilder<'_, Postgres>,
    query: &OpportunityListQuery,
    tag_ids: &[i64],
) {
    if let Some(q) = &query.q {
        let needle = format!("%{}%", q.trim());
        builder.push(" and (");
        builder.push("o.title ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or o.short_description ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or o.full_description ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or ep.company_name ilike ");
        builder.push_bind(needle);
        builder.push(")");
    }

    if let Some(city_id) = query.city_id {
        builder.push(" and coalesce(o.city_id, a.city_id) = ");
        builder.push_bind(city_id);
    }
    if let Some(work_format) = query.work_format {
        builder.push(" and o.work_format = ");
        builder.push_bind(work_format);
    }
    if let Some(opportunity_type) = query.opportunity_type {
        builder.push(" and o.opportunity_type = ");
        builder.push_bind(opportunity_type);
    }
    if let Some(level) = query.level {
        builder.push(" and o.level = ");
        builder.push_bind(level);
    }
    if let Some(employment_type) = query.employment_type {
        builder.push(" and o.employment_type = ");
        builder.push_bind(employment_type);
    }
    if let Some(salary_from) = query.salary_from {
        builder.push(" and coalesce(o.salary_to, o.salary_from, 0) >= ");
        builder.push_bind(salary_from);
    }
    if let Some(salary_to) = query.salary_to {
        builder.push(" and coalesce(o.salary_from, o.salary_to, 0) <= ");
        builder.push_bind(salary_to);
    }
    if !tag_ids.is_empty() {
        builder.push(" and exists (");
        builder.push("select 1 from opportunity_tags otf where otf.opportunity_id = o.id and otf.tag_id in (");
        let mut separated = builder.separated(", ");
        for tag_id in tag_ids.iter().copied() {
            separated.push_bind(tag_id);
        }
        separated.push_unseparated(")");
        builder.push(")");
    }
}

fn append_own_filters(
    builder: &mut QueryBuilder<'_, Postgres>,
    user_id: i64,
    query: &EmployerOwnOpportunityListQuery,
) {
    builder.push(" and ep.user_id = ");
    builder.push_bind(user_id);

    if let Some(q) = &query.q {
        let needle = format!("%{}%", q.trim());
        builder.push(" and (");
        builder.push("o.title ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or o.short_description ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or o.full_description ilike ");
        builder.push_bind(needle);
        builder.push(")");
    }
    if let Some(publication_status) = query.publication_status {
        builder.push(" and o.publication_status = ");
        builder.push_bind(publication_status);
    }
    if let Some(work_format) = query.work_format {
        builder.push(" and o.work_format = ");
        builder.push_bind(work_format);
    }
    if let Some(opportunity_type) = query.opportunity_type {
        builder.push(" and o.opportunity_type = ");
        builder.push_bind(opportunity_type);
    }
}

fn summary_select_sql(where_clause: &'static str) -> &'static str {
    match where_clause {
        "where o.publication_status = 'active'" => r#"
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
                coalesce(c.longitude, a.longitude) as longitude,
                o.event_date
            from opportunities o
            left join employer_profiles ep on ep.id = o.employer_profile_id
            left join cities c on c.id = o.city_id
            left join addresses a on a.id = o.address_id
            left join cities ac on ac.id = a.city_id
            where o.publication_status = 'active'
        "#,
        _ => r#"
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
                coalesce(c.longitude, a.longitude) as longitude,
                o.event_date
            from opportunities o
            join employer_profiles ep on ep.id = o.employer_profile_id
            left join cities c on c.id = o.city_id
            left join addresses a on a.id = o.address_id
            left join cities ac on ac.id = a.city_id
            where 1 = 1
        "#,
    }
}

fn public_details_sql() -> &'static str {
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
        coalesce(c.longitude, a.longitude) as longitude,
        o.full_description,
        o.employment_type,
        o.level,
        o.published_at,
        o.expires_at,
        o.event_date,
        o.contact_info,
        o.resource_links,
        o.media
    from opportunities o
    left join employer_profiles ep on ep.id = o.employer_profile_id
    left join cities c on c.id = o.city_id
    left join addresses a on a.id = o.address_id
    left join cities ac on ac.id = a.city_id
    where o.id = $1
      and o.publication_status = 'active'
    "#
}

fn own_details_sql() -> &'static str {
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
        coalesce(c.longitude, a.longitude) as longitude,
        o.full_description,
        o.employment_type,
        o.level,
        o.published_at,
        o.expires_at,
        o.event_date,
        o.contact_info,
        o.resource_links,
        o.media
    from opportunities o
    join employer_profiles ep on ep.id = o.employer_profile_id
    left join cities c on c.id = o.city_id
    left join addresses a on a.id = o.address_id
    left join cities ac on ac.id = a.city_id
    where o.id = $1
      and ep.user_id = $2
    "#
}
