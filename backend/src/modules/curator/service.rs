use chrono::Utc;
use sqlx::PgPool;

use crate::{
    error::{AppError, AppResult},
    models::{ApplicantProfileRow, AppRole, EmployerProfileRow, OpportunityType, PublicationStatus, VerificationRequestStatus, WorkFormat},
    modules::{
        opportunities::repo::{OpportunityDetailsRow, OpportunityWritePayload},
    },
};

use super::{dto::{
    CuratorApplicantProfileUpdateRequest,
    CuratorApplicantProfilesQuery,
    CuratorEmployerProfileUpdateRequest,
    CuratorEmployerProfilesQuery,
    CuratorOpportunitiesQuery,
    CuratorOpportunityUpdateRequest,
    VerificationRequestUpdateRequest,
}, repo};

pub async fn list_verification_requests(pool: &PgPool) -> AppResult<Vec<crate::modules::employer_dashboard::repo::VerificationRequestRow>> {
    repo::list_verification_requests(pool).await.map_err(AppError::from)
}

pub async fn get_verification_request_by_id(
    pool: &PgPool,
    verification_request_id: i64,
) -> AppResult<crate::modules::employer_dashboard::repo::VerificationRequestRow> {
    repo::get_verification_request_by_id(pool, verification_request_id)
        .await?
        .ok_or_else(|| AppError::not_found("Verification request not found"))
}

pub async fn review_verification_request(
    pool: &PgPool,
    reviewer_role: AppRole,
    reviewer_user_id: i64,
    verification_request_id: i64,
    req: VerificationRequestUpdateRequest,
) -> AppResult<crate::modules::employer_dashboard::repo::VerificationRequestRow> {
    ensure_curator_or_admin(reviewer_role)?;

    if req.status == VerificationRequestStatus::Pending {
        return Err(AppError::bad_request("Verification review status must be approved or rejected"));
    }

    let comment = req.comment.map(clean_nullable);
    let reviewed_at = Utc::now();

    let mut tx = pool.begin().await?;
    let row = repo::review_verification_request(
        &mut tx,
        verification_request_id,
        req.status,
        comment.as_deref(),
        reviewer_user_id,
        reviewed_at,
    )
    .await
    .map_err(AppError::from)?;

    repo::sync_employer_verification_from_request(
        &mut tx,
        row.employer_profile_id,
        row.status,
        comment.as_deref(),
        reviewed_at,
    )
    .await
    .map_err(AppError::from)?;

    tx.commit().await?;
    Ok(row)
}

pub async fn list_employer_profiles(
    pool: &PgPool,
    role: AppRole,
    query: &CuratorEmployerProfilesQuery,
) -> AppResult<(Vec<EmployerProfileRow>, i64)> {
    ensure_curator_or_admin(role)?;
    repo::list_employer_profiles(pool, query).await.map_err(AppError::from)
}

pub async fn get_employer_profile_by_id(pool: &PgPool, role: AppRole, employer_profile_id: i64) -> AppResult<EmployerProfileRow> {
    ensure_curator_or_admin(role)?;
    repo::get_employer_profile_by_id(pool, employer_profile_id)
        .await?
        .ok_or_else(|| AppError::not_found("Employer profile not found"))
}

pub async fn update_employer_profile_by_id(
    pool: &PgPool,
    role: AppRole,
    employer_profile_id: i64,
    req: CuratorEmployerProfileUpdateRequest,
) -> AppResult<EmployerProfileRow> {
    ensure_curator_or_admin(role)?;

    let current = get_employer_profile_by_id(pool, role, employer_profile_id).await?;

    let company_name = req.company_name.or(current.company_name).map(clean_non_empty);
    if company_name.as_deref().unwrap_or_default().is_empty() {
        return Err(AppError::bad_request("companyName must not be empty"));
    }

    let short_description = req.short_description.or(current.short_description).map(clean_nullable);
    let industry = req.industry.or(current.industry).map(clean_nullable);
    let website_url = req.website_url.or(current.website_url).map(clean_nullable);
    let promo_video_url = req.promo_video_url.or(current.promo_video_url).map(clean_nullable);
    let social_links = req.social_links.unwrap_or_else(|| json_value_to_vec_string(&current.social_links));
    let office_photos = req.office_photos.unwrap_or_else(|| json_value_to_vec_string(&current.office_photos));
    let city_id = req.city_id.or(current.city_id);
    let verification_status = req.verification_status.unwrap_or(current.verification_status);
    let verification_comment = req
        .verification_comment
        .or(current.verification_comment)
        .map(clean_nullable);
    let verified_at = match verification_status {
        crate::models::EmployerVerificationStatus::Verified => req.verified_at.or(current.verified_at).or_else(|| Some(Utc::now())),
        _ => None,
    };

    repo::update_employer_profile_by_id(
        pool,
        employer_profile_id,
        company_name.as_deref(),
        short_description.as_deref(),
        industry.as_deref(),
        website_url.as_deref(),
        &social_links,
        &office_photos,
        promo_video_url.as_deref(),
        city_id,
        verification_status,
        verification_comment.as_deref(),
        verified_at,
    )
    .await
    .map_err(AppError::from)
}

pub async fn list_applicant_profiles(
    pool: &PgPool,
    role: AppRole,
    query: &CuratorApplicantProfilesQuery,
) -> AppResult<(Vec<ApplicantProfileRow>, i64)> {
    ensure_curator_or_admin(role)?;
    repo::list_applicant_profiles(pool, query).await.map_err(AppError::from)
}

pub async fn get_applicant_profile_by_id(pool: &PgPool, role: AppRole, applicant_profile_id: i64) -> AppResult<ApplicantProfileRow> {
    ensure_curator_or_admin(role)?;
    repo::get_applicant_profile_by_id(pool, applicant_profile_id)
        .await?
        .ok_or_else(|| AppError::not_found("Applicant profile not found"))
}

pub async fn update_applicant_profile_by_id(
    pool: &PgPool,
    role: AppRole,
    applicant_profile_id: i64,
    req: CuratorApplicantProfileUpdateRequest,
) -> AppResult<ApplicantProfileRow> {
    ensure_curator_or_admin(role)?;

    let current = get_applicant_profile_by_id(pool, role, applicant_profile_id).await?;

    let full_name = req.full_name.or(current.full_name).map(clean_non_empty);
    if full_name.as_deref().unwrap_or_default().is_empty() {
        return Err(AppError::bad_request("fullName must not be empty"));
    }

    let university = req.university.or(current.university).map(clean_nullable);
    let study_course = req.study_course.or(current.study_course).map(clean_nullable);
    let about = req.about.or(current.about).map(clean_nullable);
    let resume_text = req.resume_text.or(current.resume_text).map(clean_nullable);
    let graduation_year = req.graduation_year.or(current.graduation_year);
    if let Some(year) = graduation_year {
        if !(2000..=2100).contains(&year) {
            return Err(AppError::bad_request("graduationYear must be between 2000 and 2100"));
        }
    }
    let portfolio_links = req
        .portfolio_links
        .unwrap_or_else(|| json_value_to_vec_string(&current.portfolio_links));

    repo::update_applicant_profile_by_id(
        pool,
        applicant_profile_id,
        full_name.as_deref(),
        university.as_deref(),
        study_course.as_deref(),
        graduation_year,
        about.as_deref(),
        resume_text.as_deref(),
        &portfolio_links,
    )
    .await
    .map_err(AppError::from)
}

pub async fn list_opportunities(
    pool: &PgPool,
    role: AppRole,
    query: &CuratorOpportunitiesQuery,
) -> AppResult<(Vec<crate::modules::opportunities::repo::OpportunitySummaryRow>, i64)> {
    ensure_curator_or_admin(role)?;
    repo::list_opportunities(pool, query).await.map_err(AppError::from)
}

pub async fn get_opportunity_by_id(
    pool: &PgPool,
    role: AppRole,
    opportunity_id: i64,
) -> AppResult<OpportunityDetailsRow> {
    ensure_curator_or_admin(role)?;
    repo::get_opportunity_by_id(pool, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found"))
}

pub async fn update_opportunity_by_id(
    pool: &PgPool,
    role: AppRole,
    opportunity_id: i64,
    req: CuratorOpportunityUpdateRequest,
) -> AppResult<OpportunityDetailsRow> {
    ensure_curator_or_admin(role)?;
    let current = get_opportunity_by_id(pool, role, opportunity_id).await?;

    let tag_ids = req.tag_ids.clone().unwrap_or_else(|| current.tag_ids.clone());
    if !repo::all_tag_ids_exist(pool, &tag_ids).await? {
        return Err(AppError::bad_request("Some tagIds do not exist or are inactive"));
    }

    let payload = OpportunityWritePayload {
        title: req.title.unwrap_or(current.title).trim().to_string(),
        short_description: req.short_description
            .unwrap_or(current.short_description.unwrap_or_default())
            .trim()
            .to_string(),
        full_description: req.full_description
            .unwrap_or(current.full_description.unwrap_or_default())
            .trim()
            .to_string(),
        opportunity_type: current.opportunity_type,
        work_format: req.work_format.unwrap_or(current.work_format),
        employment_type: req.employment_type.or(current.employment_type),
        level: req.level.or(current.level),
        city_id: req.city_id.or(current.city_id),
        address_id: req.address_id.or(current.address_id),
        salary_from: req.salary_from.or(current.salary_from),
        salary_to: req.salary_to.or(current.salary_to),
        published_at: current.published_at,
        expires_at: req.expires_at.or(current.expires_at),
        event_date: req.event_date.or(current.event_date),
        contact_info: req.contact_info.unwrap_or(current.contact_info),
        resource_links: req.resource_links.unwrap_or_else(|| json_value_to_vec_string(&current.resource_links)),
        media: req.media.unwrap_or_else(|| json_value_to_vec_string(&current.media)),
    };

    validate_opportunity_payload(&payload)?;

    let publication_status = req.publication_status.unwrap_or(current.publication_status);

    let mut tx = pool.begin().await?;
    repo::update_opportunity_as_curator(&mut tx, opportunity_id, &payload, publication_status)
        .await
        .map_err(AppError::from)?;
    repo::replace_opportunity_tags(&mut tx, opportunity_id, &tag_ids)
        .await
        .map_err(AppError::from)?;
    tx.commit().await?;

    repo::get_opportunity_by_id(pool, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found after update"))
}

fn ensure_curator_or_admin(role: AppRole) -> AppResult<()> {
    match role {
        AppRole::Curator | AppRole::AdminCurator => Ok(()),
        _ => Err(AppError::forbidden("Insufficient permissions")),
    }
}

fn validate_opportunity_payload(payload: &OpportunityWritePayload) -> AppResult<()> {
    if payload.title.len() < 3 || payload.title.len() > 200 {
        return Err(AppError::bad_request("title must be between 3 and 200 characters"));
    }
    if payload.short_description.len() < 10 || payload.short_description.len() > 1000 {
        return Err(AppError::bad_request("shortDescription must be between 10 and 1000 characters"));
    }
    if payload.full_description.len() < 30 {
        return Err(AppError::bad_request("fullDescription must be at least 30 characters"));
    }
    if let (Some(from), Some(to)) = (payload.salary_from, payload.salary_to) {
        if from > to {
            return Err(AppError::bad_request("salaryFrom must not exceed salaryTo"));
        }
    }
    match payload.work_format {
        WorkFormat::Remote if payload.city_id.is_none() => {
            return Err(AppError::bad_request("cityId is required for remote opportunity"));
        }
        WorkFormat::Office | WorkFormat::Hybrid if payload.address_id.is_none() => {
            return Err(AppError::bad_request("addressId is required for office/hybrid opportunity"));
        }
        _ => {}
    }
    match payload.opportunity_type {
        OpportunityType::Event if payload.event_date.is_none() => {
            return Err(AppError::bad_request("eventDate is required for event opportunity"));
        }
        OpportunityType::Vacancy | OpportunityType::Internship | OpportunityType::Mentoring if payload.expires_at.is_none() => {
            return Err(AppError::bad_request("expiresAt is required for vacancy/internship/mentoring"));
        }
        _ => {}
    }
    if !payload.contact_info.is_object() {
        return Err(AppError::bad_request("contactInfo must be an object"));
    }
    let has_email = payload.contact_info
        .get("email")
        .and_then(|v| v.as_str())
        .map(|v| !v.trim().is_empty())
        .unwrap_or(false);
    if !has_email {
        return Err(AppError::bad_request("contactInfo.email is required"));
    }
    Ok(())
}

fn clean_non_empty(value: String) -> String { value.trim().to_string() }
fn clean_nullable(value: String) -> String { value.trim().to_string() }

fn json_value_to_vec_string(value: &serde_json::Value) -> Vec<String> {
    match value {
        serde_json::Value::Array(items) => items.iter().filter_map(|v| v.as_str().map(ToOwned::to_owned)).collect(),
        _ => Vec::new(),
    }
}
