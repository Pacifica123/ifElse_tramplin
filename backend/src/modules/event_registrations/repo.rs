use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool, Postgres, QueryBuilder, Transaction};

use crate::models::{
    EventRegistrationRow, EventRegistrationStatus, OpportunityType, PublicationStatus, WorkFormat,
};

use super::dto::EventRegistrationListQuery;

#[derive(Debug, Clone, FromRow)]
pub struct OpportunityEventTargetRow {
    pub id: i64,
    pub opportunity_type: OpportunityType,
    pub publication_status: PublicationStatus,
}

#[derive(Debug, Clone, FromRow)]
pub struct EventRegistrationListItemRow {
    pub registration_id: i64,
    pub registration_opportunity_id: i64,
    pub registration_applicant_profile_id: i64,
    pub registration_status: EventRegistrationStatus,
    pub registration_created_at: DateTime<Utc>,
    pub registration_updated_at: DateTime<Utc>,
    pub registration_cancelled_at: Option<DateTime<Utc>>,

    pub opportunity_id: i64,
    pub opportunity_title: String,
    pub opportunity_short_description: Option<String>,
    pub opportunity_employer_profile_id: i64,
    pub opportunity_employer_name: Option<String>,
    pub opportunity_opportunity_type: OpportunityType,
    pub opportunity_work_format: WorkFormat,
    pub opportunity_publication_status: PublicationStatus,
    pub opportunity_city_id: Option<i64>,
    pub opportunity_address_id: Option<i64>,
    pub opportunity_event_date: Option<DateTime<Utc>>,
    pub opportunity_salary_from: Option<i32>,
    pub opportunity_salary_to: Option<i32>,
    pub opportunity_tag_ids: Vec<i64>,
    pub opportunity_city_name: Option<String>,
    pub opportunity_address_text: Option<String>,
    pub opportunity_latitude: Option<f64>,
    pub opportunity_longitude: Option<f64>,
}

pub async fn find_event_target_by_id(
    pool: &PgPool,
    opportunity_id: i64,
) -> Result<Option<OpportunityEventTargetRow>, sqlx::Error> {
    sqlx::query_as::<_, OpportunityEventTargetRow>(
        r#"
        select
            id,
            opportunity_type,
            publication_status
        from opportunities
        where id = $1
        "#,
    )
    .bind(opportunity_id)
    .fetch_optional(pool)
    .await
}

pub async fn find_registration_by_opportunity_and_applicant(
    pool: &PgPool,
    opportunity_id: i64,
    applicant_profile_id: i64,
) -> Result<Option<EventRegistrationRow>, sqlx::Error> {
    sqlx::query_as::<_, EventRegistrationRow>(
        r#"
        select
            id,
            opportunity_id,
            applicant_profile_id,
            status,
            created_at,
            updated_at,
            cancelled_at
        from event_registrations
        where opportunity_id = $1
          and applicant_profile_id = $2
        "#,
    )
    .bind(opportunity_id)
    .bind(applicant_profile_id)
    .fetch_optional(pool)
    .await
}

pub async fn insert_registration(
    tx: &mut Transaction<'_, Postgres>,
    opportunity_id: i64,
    applicant_profile_id: i64,
) -> Result<EventRegistrationRow, sqlx::Error> {
    sqlx::query_as::<_, EventRegistrationRow>(
        r#"
        insert into event_registrations (
            opportunity_id,
            applicant_profile_id
        )
        values ($1, $2)
        returning
            id,
            opportunity_id,
            applicant_profile_id,
            status,
            created_at,
            updated_at,
            cancelled_at
        "#,
    )
    .bind(opportunity_id)
    .bind(applicant_profile_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn reactivate_registration(
    pool: &PgPool,
    registration_id: i64,
) -> Result<EventRegistrationRow, sqlx::Error> {
    sqlx::query_as::<_, EventRegistrationRow>(
        r#"
        update event_registrations
        set
            status = 'registered',
            cancelled_at = null
        where id = $1
        returning
            id,
            opportunity_id,
            applicant_profile_id,
            status,
            created_at,
            updated_at,
            cancelled_at
        "#,
    )
    .bind(registration_id)
    .fetch_one(pool)
    .await
}

pub async fn cancel_registration(
    pool: &PgPool,
    registration_id: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        update event_registrations
        set
            status = 'cancelled',
            cancelled_at = now()
        where id = $1
        "#,
    )
    .bind(registration_id)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn list_my_event_registrations(
    pool: &PgPool,
    applicant_profile_id: i64,
    query: &EventRegistrationListQuery,
) -> Result<(Vec<EventRegistrationListItemRow>, i64), sqlx::Error> {
    let page = query.page();
    let per_page = query.per_page();
    let offset = (page - 1) * per_page;

    let mut count_builder = list_query_builder(true);
    append_list_filters(&mut count_builder, applicant_profile_id, query);
    let total: i64 = count_builder.build_query_scalar().fetch_one(pool).await?;

    let mut builder = list_query_builder(false);
    append_list_filters(&mut builder, applicant_profile_id, query);
    builder.push(" order by o.event_date asc nulls last, er.created_at desc, er.id desc ");
    builder.push(" limit ");
    builder.push_bind(per_page);
    builder.push(" offset ");
    builder.push_bind(offset);

    let items = builder
        .build_query_as::<EventRegistrationListItemRow>()
        .fetch_all(pool)
        .await?;

    Ok((items, total))
}

fn list_query_builder(count_only: bool) -> QueryBuilder<'static, Postgres> {
    if count_only {
        QueryBuilder::<Postgres>::new(
            r#"
            select count(*)::bigint
            from event_registrations er
            join opportunities o on o.id = er.opportunity_id
            left join employer_profiles ep on ep.id = o.employer_profile_id
            left join cities c on c.id = o.city_id
            left join addresses a on a.id = o.address_id
            left join cities ac on ac.id = a.city_id
            where er.applicant_profile_id = 
            "#,
        )
    } else {
        QueryBuilder::<Postgres>::new(
            r#"
            select
                er.id as registration_id,
                er.opportunity_id as registration_opportunity_id,
                er.applicant_profile_id as registration_applicant_profile_id,
                er.status as registration_status,
                er.created_at as registration_created_at,
                er.updated_at as registration_updated_at,
                er.cancelled_at as registration_cancelled_at,
                o.id as opportunity_id,
                o.title as opportunity_title,
                o.short_description as opportunity_short_description,
                o.employer_profile_id as opportunity_employer_profile_id,
                ep.company_name as opportunity_employer_name,
                o.opportunity_type as opportunity_opportunity_type,
                o.work_format as opportunity_work_format,
                o.publication_status as opportunity_publication_status,
                o.city_id as opportunity_city_id,
                o.address_id as opportunity_address_id,
                o.event_date as opportunity_event_date,
                o.salary_from as opportunity_salary_from,
                o.salary_to as opportunity_salary_to,
                coalesce((
                    select array_agg(ot.tag_id order by ot.tag_id)
                    from opportunity_tags ot
                    where ot.opportunity_id = o.id
                ), '{}'::bigint[]) as opportunity_tag_ids,
                coalesce(c.city_name, ac.city_name) as opportunity_city_name,
                a.full_address as opportunity_address_text,
                coalesce(c.latitude, a.latitude) as opportunity_latitude,
                coalesce(c.longitude, a.longitude) as opportunity_longitude
            from event_registrations er
            join opportunities o on o.id = er.opportunity_id
            left join employer_profiles ep on ep.id = o.employer_profile_id
            left join cities c on c.id = o.city_id
            left join addresses a on a.id = o.address_id
            left join cities ac on ac.id = a.city_id
            where er.applicant_profile_id = 
            "#,
        )
    }
}

fn append_list_filters(
    builder: &mut QueryBuilder<'_, Postgres>,
    applicant_profile_id: i64,
    query: &EventRegistrationListQuery,
) {
    builder.push_bind(applicant_profile_id);

    if let Some(status) = query.status {
        builder.push(" and er.status = ");
        builder.push_bind(status);
    }

    if let Some(q) = &query.q {
        let needle = format!("%{}%", q.trim());
        builder.push(" and o.title ilike ");
        builder.push_bind(needle);
    }

    if query.upcoming_only {
        builder.push(" and o.event_date >= now() ");
    }
}
