use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool, Postgres, QueryBuilder, Transaction};

use crate::{
    models::{ApplicantProfileRow, EmployerProfileRow, EmployerVerificationStatus, OpportunityType, PublicationStatus, VerificationRequestStatus},
    modules::{
        employer_dashboard::repo::VerificationRequestRow,
        opportunities::repo::{OpportunityDetailsRow, OpportunitySummaryRow, OpportunityWritePayload},
    },
};

use super::dto::{CuratorApplicantProfilesQuery, CuratorEmployerProfilesQuery, CuratorOpportunitiesQuery};

pub async fn list_verification_requests(pool: &PgPool) -> Result<Vec<VerificationRequestRow>, sqlx::Error> {
    sqlx::query_as::<_, VerificationRequestRow>(
        r#"
        select
            id,
            employer_profile_id,
            status,
            comment,
            submitted_at,
            reviewed_at,
            reviewed_by_curator_id
        from verification_requests
        order by submitted_at desc, id desc
        "#,
    )
    .fetch_all(pool)
    .await
}

pub async fn get_verification_request_by_id(pool: &PgPool, verification_request_id: i64) -> Result<Option<VerificationRequestRow>, sqlx::Error> {
    sqlx::query_as::<_, VerificationRequestRow>(
        r#"
        select
            id,
            employer_profile_id,
            status,
            comment,
            submitted_at,
            reviewed_at,
            reviewed_by_curator_id
        from verification_requests
        where id = $1
        "#,
    )
    .bind(verification_request_id)
    .fetch_optional(pool)
    .await
}

pub async fn review_verification_request(
    tx: &mut Transaction<'_, Postgres>,
    verification_request_id: i64,
    status: VerificationRequestStatus,
    comment: Option<&str>,
    reviewed_by_curator_id: i64,
    reviewed_at: DateTime<Utc>,
) -> Result<VerificationRequestRow, sqlx::Error> {
    sqlx::query_as::<_, VerificationRequestRow>(
        r#"
        update verification_requests
        set
            status = $2,
            comment = $3,
            reviewed_at = $4,
            reviewed_by_curator_id = $5
        where id = $1
        returning
            id,
            employer_profile_id,
            status,
            comment,
            submitted_at,
            reviewed_at,
            reviewed_by_curator_id
        "#,
    )
    .bind(verification_request_id)
    .bind(status)
    .bind(comment)
    .bind(reviewed_at)
    .bind(reviewed_by_curator_id)
    .fetch_one(&mut **tx)
    .await
}

pub async fn sync_employer_verification_from_request(
    tx: &mut Transaction<'_, Postgres>,
    employer_profile_id: i64,
    request_status: VerificationRequestStatus,
    comment: Option<&str>,
    reviewed_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    let verification_status = match request_status {
        VerificationRequestStatus::Pending => EmployerVerificationStatus::Pending,
        VerificationRequestStatus::Approved => EmployerVerificationStatus::Verified,
        VerificationRequestStatus::Rejected => EmployerVerificationStatus::Rejected,
    };

    let verified_at = if verification_status == EmployerVerificationStatus::Verified {
        Some(reviewed_at)
    } else {
        None
    };

    sqlx::query(
        r#"
        update employer_profiles
        set
            verification_status = $2,
            verification_comment = $3,
            verified_at = $4
        where id = $1
        "#,
    )
    .bind(employer_profile_id)
    .bind(verification_status)
    .bind(comment)
    .bind(verified_at)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn list_employer_profiles(
    pool: &PgPool,
    query: &CuratorEmployerProfilesQuery,
) -> Result<(Vec<EmployerProfileRow>, i64), sqlx::Error> {
    let page = query.page();
    let per_page = query.per_page();
    let offset = (page - 1) * per_page;

    let mut count_builder = employer_profiles_query_builder(true);
    append_employer_profile_filters(&mut count_builder, query);
    let total: i64 = count_builder.build_query_scalar().fetch_one(pool).await?;

    let mut builder = employer_profiles_query_builder(false);
    append_employer_profile_filters(&mut builder, query);
    builder.push(" order by ep.updated_at desc, ep.id desc ");
    builder.push(" limit ");
    builder.push_bind(per_page);
    builder.push(" offset ");
    builder.push_bind(offset);

    let items = builder.build_query_as::<EmployerProfileRow>().fetch_all(pool).await?;
    Ok((items, total))
}

pub async fn get_employer_profile_by_id(pool: &PgPool, employer_profile_id: i64) -> Result<Option<EmployerProfileRow>, sqlx::Error> {
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
        where id = $1
        "#,
    )
    .bind(employer_profile_id)
    .fetch_optional(pool)
    .await
}

#[allow(clippy::too_many_arguments)]
pub async fn update_employer_profile_by_id(
    pool: &PgPool,
    employer_profile_id: i64,
    company_name: Option<&str>,
    short_description: Option<&str>,
    industry: Option<&str>,
    website_url: Option<&str>,
    social_links: &[String],
    office_photos: &[String],
    promo_video_url: Option<&str>,
    city_id: Option<i64>,
    verification_status: EmployerVerificationStatus,
    verification_comment: Option<&str>,
    verified_at: Option<DateTime<Utc>>,
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
            city_id = $9,
            verification_status = $10,
            verification_comment = $11,
            verified_at = $12
        where id = $1
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
    .bind(employer_profile_id)
    .bind(company_name)
    .bind(short_description)
    .bind(industry)
    .bind(website_url)
    .bind(sqlx::types::Json(social_links.to_vec()))
    .bind(sqlx::types::Json(office_photos.to_vec()))
    .bind(promo_video_url)
    .bind(city_id)
    .bind(verification_status)
    .bind(verification_comment)
    .bind(verified_at)
    .fetch_one(pool)
    .await
}

pub async fn list_applicant_profiles(
    pool: &PgPool,
    query: &CuratorApplicantProfilesQuery,
) -> Result<(Vec<ApplicantProfileRow>, i64), sqlx::Error> {
    let page = query.page();
    let per_page = query.per_page();
    let offset = (page - 1) * per_page;

    let mut count_builder = applicant_profiles_query_builder(true);
    append_applicant_profile_filters(&mut count_builder, query);
    let total: i64 = count_builder.build_query_scalar().fetch_one(pool).await?;

    let mut builder = applicant_profiles_query_builder(false);
    append_applicant_profile_filters(&mut builder, query);
    builder.push(" order by ap.updated_at desc, ap.id desc ");
    builder.push(" limit ");
    builder.push_bind(per_page);
    builder.push(" offset ");
    builder.push_bind(offset);

    let items = builder.build_query_as::<ApplicantProfileRow>().fetch_all(pool).await?;
    Ok((items, total))
}

pub async fn get_applicant_profile_by_id(pool: &PgPool, applicant_profile_id: i64) -> Result<Option<ApplicantProfileRow>, sqlx::Error> {
    sqlx::query_as::<_, ApplicantProfileRow>(
        r#"
        select
            id,
            user_id,
            full_name,
            university,
            study_course,
            graduation_year,
            about,
            resume_text,
            portfolio_links,
            skills,
            created_at,
            updated_at
        from applicant_profiles
        where id = $1
        "#,
    )
    .bind(applicant_profile_id)
    .fetch_optional(pool)
    .await
}

pub async fn update_applicant_profile_by_id(
    pool: &PgPool,
    applicant_profile_id: i64,
    full_name: Option<&str>,
    university: Option<&str>,
    study_course: Option<&str>,
    graduation_year: Option<i32>,
    about: Option<&str>,
    resume_text: Option<&str>,
    portfolio_links: &[String],
) -> Result<ApplicantProfileRow, sqlx::Error> {
    sqlx::query_as::<_, ApplicantProfileRow>(
        r#"
        update applicant_profiles
        set
            full_name = $2,
            university = $3,
            study_course = $4,
            graduation_year = $5,
            about = $6,
            resume_text = $7,
            portfolio_links = $8::jsonb
        where id = $1
        returning
            id,
            user_id,
            full_name,
            university,
            study_course,
            graduation_year,
            about,
            resume_text,
            portfolio_links,
            skills,
            created_at,
            updated_at
        "#,
    )
    .bind(applicant_profile_id)
    .bind(full_name)
    .bind(university)
    .bind(study_course)
    .bind(graduation_year)
    .bind(about)
    .bind(resume_text)
    .bind(sqlx::types::Json(portfolio_links.to_vec()))
    .fetch_one(pool)
    .await
}

pub async fn list_opportunities(
    pool: &PgPool,
    query: &CuratorOpportunitiesQuery,
) -> Result<(Vec<OpportunitySummaryRow>, i64), sqlx::Error> {
    let page = query.page();
    let per_page = query.per_page();
    let offset = (page - 1) * per_page;

    let mut count_builder = opportunities_query_builder(true);
    append_opportunity_filters(&mut count_builder, query);
    let total: i64 = count_builder.build_query_scalar().fetch_one(pool).await?;

    let mut builder = opportunities_query_builder(false);
    append_opportunity_filters(&mut builder, query);
    builder.push(" order by o.updated_at desc, o.id desc ");
    builder.push(" limit ");
    builder.push_bind(per_page);
    builder.push(" offset ");
    builder.push_bind(offset);

    let items = builder.build_query_as::<OpportunitySummaryRow>().fetch_all(pool).await?;
    Ok((items, total))
}

pub async fn get_opportunity_by_id(pool: &PgPool, opportunity_id: i64) -> Result<Option<OpportunityDetailsRow>, sqlx::Error> {
    sqlx::query_as::<_, OpportunityDetailsRow>(
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
        "#,
    )
    .bind(opportunity_id)
    .fetch_optional(pool)
    .await
}

pub async fn update_opportunity_as_curator(
    tx: &mut Transaction<'_, Postgres>,
    opportunity_id: i64,
    payload: &OpportunityWritePayload,
    publication_status: PublicationStatus,
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
            expires_at = $12,
            event_date = $13,
            contact_info = $14,
            resource_links = $15::jsonb,
            media = $16::jsonb,
            publication_status = $17
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
    .bind(payload.expires_at)
    .bind(payload.event_date)
    .bind(&payload.contact_info)
    .bind(sqlx::types::Json(payload.resource_links.clone()))
    .bind(sqlx::types::Json(payload.media.clone()))
    .bind(publication_status)
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

fn employer_profiles_query_builder(count_only: bool) -> QueryBuilder<'static, Postgres> {
    if count_only {
        QueryBuilder::<Postgres>::new(
            r#"
            select count(*) as total
            from employer_profiles ep
            join users u on u.id = ep.user_id
            where 1 = 1
            "#,
        )
    } else {
        QueryBuilder::<Postgres>::new(
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
            from employer_profiles ep
            join users u on u.id = ep.user_id
            where 1 = 1
            "#,
        )
    }
}

fn append_employer_profile_filters(builder: &mut QueryBuilder<'_, Postgres>, query: &CuratorEmployerProfilesQuery) {
    if let Some(q) = &query.q {
        let needle = format!("%{}%", q.trim());
        builder.push(" and (");
        builder.push("coalesce(ep.company_name, '') ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or coalesce(ep.short_description, '') ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or u.email ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or u.display_name ilike ");
        builder.push_bind(needle);
        builder.push(")");
    }
    if let Some(status) = query.verification_status {
        builder.push(" and ep.verification_status = ");
        builder.push_bind(status);
    }
}

fn applicant_profiles_query_builder(count_only: bool) -> QueryBuilder<'static, Postgres> {
    if count_only {
        QueryBuilder::<Postgres>::new(
            r#"
            select count(*) as total
            from applicant_profiles ap
            join users u on u.id = ap.user_id
            where 1 = 1
            "#,
        )
    } else {
        QueryBuilder::<Postgres>::new(
            r#"
            select
                ap.id,
                ap.user_id,
                ap.full_name,
                ap.university,
                ap.study_course,
                ap.graduation_year,
                ap.about,
                ap.resume_text,
                ap.portfolio_links,
                ap.skills,
                ap.created_at,
                ap.updated_at
            from applicant_profiles ap
            join users u on u.id = ap.user_id
            where 1 = 1
            "#,
        )
    }
}

fn append_applicant_profile_filters(builder: &mut QueryBuilder<'_, Postgres>, query: &CuratorApplicantProfilesQuery) {
    if let Some(q) = &query.q {
        let needle = format!("%{}%", q.trim());
        builder.push(" and (");
        builder.push("coalesce(ap.full_name, '') ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or coalesce(ap.about, '') ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or u.email ilike ");
        builder.push_bind(needle);
        builder.push(")");
    }
    if let Some(university) = &query.university {
        let needle = format!("%{}%", university.trim());
        builder.push(" and coalesce(ap.university, '') ilike ");
        builder.push_bind(needle);
    }
}

fn opportunities_query_builder(count_only: bool) -> QueryBuilder<'static, Postgres> {
    if count_only {
        QueryBuilder::<Postgres>::new(
            r#"
            select count(*) as total
            from opportunities o
            join employer_profiles ep on ep.id = o.employer_profile_id
            where 1 = 1
            "#,
        )
    } else {
        QueryBuilder::<Postgres>::new(
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
                o.event_date
            from opportunities o
            join employer_profiles ep on ep.id = o.employer_profile_id
            left join cities c on c.id = o.city_id
            left join addresses a on a.id = o.address_id
            left join cities ac on ac.id = a.city_id
            where 1 = 1
            "#,
        )
    }
}

fn append_opportunity_filters(builder: &mut QueryBuilder<'_, Postgres>, query: &CuratorOpportunitiesQuery) {
    if let Some(q) = &query.q {
        let needle = format!("%{}%", q.trim());
        builder.push(" and (");
        builder.push("o.title ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or o.short_description ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or o.full_description ilike ");
        builder.push_bind(needle.clone());
        builder.push(" or coalesce(ep.company_name, '') ilike ");
        builder.push_bind(needle);
        builder.push(")");
    }
    if let Some(status) = query.publication_status {
        builder.push(" and o.publication_status = ");
        builder.push_bind(status);
    }
    if let Some(opportunity_type) = query.opportunity_type {
        builder.push(" and o.opportunity_type = ");
        builder.push_bind(opportunity_type);
    }
}
