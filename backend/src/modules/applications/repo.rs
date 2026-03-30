use chrono::{DateTime, Utc};
use sqlx::{PgPool, Postgres, QueryBuilder, Transaction};

use crate::models::{ApplicationRow, ApplicationStatus, PublicationStatus};

use super::dto::{EmployerOpportunityApplicationsQuery, MyApplicationsQuery};

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct OpportunityApplyTargetRow {
    pub id: i64,
    pub publication_status: PublicationStatus,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct EmployerOwnedOpportunityRow {
    pub id: i64,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct EmployerApplicationRow {
    pub id: i64,
    pub opportunity_id: i64,
    pub applicant_profile_id: i64,
    pub status: ApplicationStatus,
    pub cover_letter: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub applicant_id: i64,
    pub applicant_full_name: String,
    pub applicant_university: Option<String>,
    pub applicant_study_course: Option<String>,
    pub applicant_graduation_year: Option<i32>,
    pub applicant_about: Option<String>,
}

pub async fn find_apply_target_by_id(
    pool: &PgPool,
    opportunity_id: i64,
) -> Result<Option<OpportunityApplyTargetRow>, sqlx::Error> {
    sqlx::query_as::<_, OpportunityApplyTargetRow>(
        r#"
        select
            id,
            publication_status
        from opportunities
        where id = $1
        "#,
    )
    .bind(opportunity_id)
    .fetch_optional(pool)
    .await
}

pub async fn find_application_by_opportunity_and_applicant(
    pool: &PgPool,
    opportunity_id: i64,
    applicant_profile_id: i64,
) -> Result<Option<ApplicationRow>, sqlx::Error> {
    sqlx::query_as::<_, ApplicationRow>(
        r#"
        select
            id,
            opportunity_id,
            applicant_profile_id,
            status,
            cover_letter,
            created_at,
            updated_at
        from applications
        where opportunity_id = $1
          and applicant_profile_id = $2
        "#,
    )
    .bind(opportunity_id)
    .bind(applicant_profile_id)
    .fetch_optional(pool)
    .await
}

pub async fn insert_application(
    tx: &mut Transaction<'_, Postgres>,
    opportunity_id: i64,
    applicant_profile_id: i64,
    cover_letter: Option<&str>,
) -> Result<ApplicationRow, sqlx::Error> {
    sqlx::query_as::<_, ApplicationRow>(
        r#"
        insert into applications (
            opportunity_id,
            applicant_profile_id,
            cover_letter
        )
        values ($1, $2, $3)
        returning
            id,
            opportunity_id,
            applicant_profile_id,
            status,
            cover_letter,
            created_at,
            updated_at
        "#,
    )
    .bind(opportunity_id)
    .bind(applicant_profile_id)
    .bind(cover_letter)
    .fetch_one(&mut **tx)
    .await
}

pub async fn list_my_applications(
    pool: &PgPool,
    applicant_profile_id: i64,
    query: &MyApplicationsQuery,
) -> Result<(Vec<ApplicationRow>, i64), sqlx::Error> {
    let page = query.page();
    let per_page = query.per_page();
    let offset = (page - 1) * per_page;

    let total: i64 = sqlx::query_scalar(
        r#"
        select count(*)::bigint
        from applications
        where applicant_profile_id = $1
        "#,
    )
    .bind(applicant_profile_id)
    .fetch_one(pool)
    .await?;

    let items = sqlx::query_as::<_, ApplicationRow>(
        r#"
        select
            id,
            opportunity_id,
            applicant_profile_id,
            status,
            cover_letter,
            created_at,
            updated_at
        from applications
        where applicant_profile_id = $1
        order by created_at desc, id desc
        limit $2 offset $3
        "#,
    )
    .bind(applicant_profile_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    Ok((items, total))
}

pub async fn find_owned_opportunity(
    pool: &PgPool,
    employer_user_id: i64,
    opportunity_id: i64,
) -> Result<Option<EmployerOwnedOpportunityRow>, sqlx::Error> {
    sqlx::query_as::<_, EmployerOwnedOpportunityRow>(
        r#"
        select o.id
        from opportunities o
        join employer_profiles ep on ep.id = o.employer_profile_id
        where o.id = $1
          and ep.user_id = $2
        "#,
    )
    .bind(opportunity_id)
    .bind(employer_user_id)
    .fetch_optional(pool)
    .await
}

pub async fn list_employer_applications_for_opportunity(
    pool: &PgPool,
    employer_user_id: i64,
    opportunity_id: i64,
    query: &EmployerOpportunityApplicationsQuery,
) -> Result<(Vec<EmployerApplicationRow>, i64), sqlx::Error> {
    let page = query.page();
    let per_page = query.per_page();
    let offset = (page - 1) * per_page;

    let mut count_builder = employer_applications_query_builder(true);
    append_employer_applications_filters(&mut count_builder, employer_user_id, opportunity_id, query);
    let total: i64 = count_builder.build_query_scalar().fetch_one(pool).await?;

    let mut builder = employer_applications_query_builder(false);
    append_employer_applications_filters(&mut builder, employer_user_id, opportunity_id, query);
    builder.push(" order by a.created_at desc, a.id desc ");
    builder.push(" limit ");
    builder.push_bind(per_page);
    builder.push(" offset ");
    builder.push_bind(offset);

    let items = builder
        .build_query_as::<EmployerApplicationRow>()
        .fetch_all(pool)
        .await?;

    Ok((items, total))
}

pub async fn get_employer_application_by_id(
    pool: &PgPool,
    employer_user_id: i64,
    application_id: i64,
) -> Result<Option<EmployerApplicationRow>, sqlx::Error> {
    sqlx::query_as::<_, EmployerApplicationRow>(
        r#"
        select
            a.id,
            a.opportunity_id,
            a.applicant_profile_id,
            a.status,
            a.cover_letter,
            a.created_at,
            a.updated_at,
            ap.id as applicant_id,
            coalesce(ap.full_name, u.display_name) as applicant_full_name,
            ap.university as applicant_university,
            ap.study_course as applicant_study_course,
            ap.graduation_year as applicant_graduation_year,
            ap.about as applicant_about
        from applications a
        join opportunities o on o.id = a.opportunity_id
        join employer_profiles ep on ep.id = o.employer_profile_id
        join applicant_profiles ap on ap.id = a.applicant_profile_id
        join users u on u.id = ap.user_id
        where a.id = $1
          and ep.user_id = $2
        "#,
    )
    .bind(application_id)
    .bind(employer_user_id)
    .fetch_optional(pool)
    .await
}

pub async fn update_application_status(
    pool: &PgPool,
    application_id: i64,
    status: ApplicationStatus,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        update applications
        set status = $2
        where id = $1
        "#,
    )
    .bind(application_id)
    .bind(status)
    .execute(pool)
    .await?;

    Ok(())
}

fn employer_applications_query_builder(count_only: bool) -> QueryBuilder<'static, Postgres> {
    if count_only {
        QueryBuilder::<Postgres>::new(
            r#"
            select count(*)::bigint
            from applications a
            join opportunities o on o.id = a.opportunity_id
            join employer_profiles ep on ep.id = o.employer_profile_id
            join applicant_profiles ap on ap.id = a.applicant_profile_id
            join users u on u.id = ap.user_id
            where ep.user_id = 
            "#,
        )
    } else {
        QueryBuilder::<Postgres>::new(
            r#"
            select
                a.id,
                a.opportunity_id,
                a.applicant_profile_id,
                a.status,
                a.cover_letter,
                a.created_at,
                a.updated_at,
                ap.id as applicant_id,
                coalesce(ap.full_name, u.display_name) as applicant_full_name,
                ap.university as applicant_university,
                ap.study_course as applicant_study_course,
                ap.graduation_year as applicant_graduation_year,
                ap.about as applicant_about
            from applications a
            join opportunities o on o.id = a.opportunity_id
            join employer_profiles ep on ep.id = o.employer_profile_id
            join applicant_profiles ap on ap.id = a.applicant_profile_id
            join users u on u.id = ap.user_id
            where ep.user_id = 
            "#,
        )
    }
}

fn append_employer_applications_filters(
    builder: &mut QueryBuilder<'_, Postgres>,
    employer_user_id: i64,
    opportunity_id: i64,
    query: &EmployerOpportunityApplicationsQuery,
) {
    builder.push_bind(employer_user_id);
    builder.push(" and o.id = ");
    builder.push_bind(opportunity_id);

    if let Some(status) = query.status {
        builder.push(" and a.status = ");
        builder.push_bind(status);
    }

    if let Some(q) = &query.q {
        let needle = format!("%{}%", q.trim());
        builder.push(" and coalesce(ap.full_name, u.display_name) ilike ");
        builder.push_bind(needle);
    }
}
