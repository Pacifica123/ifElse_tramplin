use chrono::Utc;
use sqlx::PgPool;

use crate::{
    error::{AppError, AppResult},
    models::{EmployerProfileRow, EmployerVerificationStatus, OpportunityType, PublicationStatus, WorkFormat},
    modules::employer_profiles::repo as employer_repo,
};

use super::{dto::{OpportunityCreateRequest, OpportunityStatusUpdateRequest, OpportunityUpdateRequest}, repo::{self, OpportunityDetailsRow, OpportunityWritePayload}};

pub async fn create_own_opportunity(
    pool: &PgPool,
    user_id: i64,
    req: OpportunityCreateRequest,
) -> AppResult<OpportunityDetailsRow> {
    let employer_profile = resolve_verified_employer(pool, user_id).await?;
    validate_create_request(&req)?;
    ensure_tags_exist(pool, &req.tag_ids).await?;

    let payload = OpportunityWritePayload {
        title: req.title.trim().to_string(),
        short_description: req.short_description.trim().to_string(),
        full_description: req.full_description.trim().to_string(),
        opportunity_type: req.opportunity_type,
        work_format: req.work_format,
        employment_type: req.employment_type,
        level: req.level,
        city_id: req.city_id,
        address_id: req.address_id,
        salary_from: req.salary_from,
        salary_to: req.salary_to,
        published_at: req.published_at,
        expires_at: req.expires_at,
        event_date: req.event_date,
        contact_info: req.contact_info,
        resource_links: req.resource_links.unwrap_or_default(),
        media: req.media.unwrap_or_default(),
    };

    let mut tx = pool.begin().await?;
    let opportunity_id = repo::insert_opportunity(&mut tx, employer_profile.id, &payload).await?;
    repo::replace_opportunity_tags(&mut tx, opportunity_id, &req.tag_ids).await?;
    tx.commit().await?;

    repo::get_own_opportunity_by_id(pool, user_id, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found after creation"))
}

pub async fn update_own_opportunity(
    pool: &PgPool,
    user_id: i64,
    opportunity_id: i64,
    req: OpportunityUpdateRequest,
) -> AppResult<OpportunityDetailsRow> {
    resolve_verified_employer(pool, user_id).await?;

    let current = repo::get_own_opportunity_by_id(pool, user_id, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found"))?;

    let tag_ids = req.tag_ids.clone().unwrap_or_else(|| current.tag_ids.clone());
    ensure_tags_exist(pool, &tag_ids).await?;

    let payload = OpportunityWritePayload {
        title: req.title.unwrap_or(current.title).trim().to_string(),
        short_description: req
            .short_description
            .unwrap_or(current.short_description.unwrap_or_default())
            .trim()
            .to_string(),
        full_description: req
            .full_description
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
        published_at: req.published_at.or(current.published_at),
        expires_at: req.expires_at.or(current.expires_at),
        event_date: req.event_date.or(current.event_date),
        contact_info: req.contact_info.unwrap_or(current.contact_info),
        resource_links: req.resource_links.unwrap_or_else(|| json_value_to_vec_string(&current.resource_links)),
        media: req.media.unwrap_or_else(|| json_value_to_vec_string(&current.media)),
    };

    validate_payload(&payload)?;

    let mut tx = pool.begin().await?;
    repo::update_opportunity(&mut tx, opportunity_id, &payload).await?;
    repo::replace_opportunity_tags(&mut tx, opportunity_id, &tag_ids).await?;
    tx.commit().await?;

    repo::get_own_opportunity_by_id(pool, user_id, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found after update"))
}

pub async fn update_own_opportunity_status(
    pool: &PgPool,
    user_id: i64,
    opportunity_id: i64,
    req: OpportunityStatusUpdateRequest,
) -> AppResult<OpportunityDetailsRow> {
    resolve_verified_employer(pool, user_id).await?;

    let current = repo::get_own_opportunity_by_id(pool, user_id, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found"))?;

    if req.publication_status == PublicationStatus::Rejected {
        return Err(AppError::forbidden("Employer cannot set rejected status"));
    }

    let published_at = if req.publication_status == PublicationStatus::Active {
        current.published_at.or_else(|| Some(Utc::now()))
    } else {
        current.published_at
    };

    repo::update_opportunity_status(pool, opportunity_id, req.publication_status, published_at).await?;

    repo::get_own_opportunity_by_id(pool, user_id, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found after status update"))
}

async fn resolve_verified_employer(pool: &PgPool, user_id: i64) -> AppResult<EmployerProfileRow> {
    let employer_profile = employer_repo::find_by_user_id(pool, user_id)
        .await?
        .ok_or_else(|| AppError::forbidden("Employer profile not found"))?;

    if employer_profile.verification_status != EmployerVerificationStatus::Verified {
        return Err(AppError::forbidden("Employer is not verified"));
    }

    Ok(employer_profile)
}

async fn ensure_tags_exist(pool: &PgPool, tag_ids: &[i64]) -> AppResult<()> {
    if !repo::all_tag_ids_exist(pool, tag_ids).await? {
        return Err(AppError::bad_request("Some tagIds do not exist or are inactive"));
    }
    Ok(())
}

fn validate_create_request(req: &OpportunityCreateRequest) -> AppResult<()> {
    let payload = OpportunityWritePayload {
        title: req.title.trim().to_string(),
        short_description: req.short_description.trim().to_string(),
        full_description: req.full_description.trim().to_string(),
        opportunity_type: req.opportunity_type,
        work_format: req.work_format,
        employment_type: req.employment_type,
        level: req.level,
        city_id: req.city_id,
        address_id: req.address_id,
        salary_from: req.salary_from,
        salary_to: req.salary_to,
        published_at: req.published_at,
        expires_at: req.expires_at,
        event_date: req.event_date,
        contact_info: req.contact_info.clone(),
        resource_links: req.resource_links.clone().unwrap_or_default(),
        media: req.media.clone().unwrap_or_default(),
    };
    validate_payload(&payload)?;

    if req.tag_ids.is_empty() {
        return Err(AppError::bad_request("tagIds must not be empty"));
    }

    Ok(())
}

fn validate_payload(payload: &OpportunityWritePayload) -> AppResult<()> {
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
        OpportunityType::Vacancy | OpportunityType::Internship | OpportunityType::Mentoring
            if payload.expires_at.is_none() =>
        {
            return Err(AppError::bad_request("expiresAt is required for vacancy/internship/mentoring"));
        }
        _ => {}
    }
    if !payload.contact_info.is_object() {
        return Err(AppError::bad_request("contactInfo must be an object"));
    }
    let has_email = payload
        .contact_info
        .get("email")
        .and_then(|v| v.as_str())
        .map(|v| !v.trim().is_empty())
        .unwrap_or(false);
    if !has_email {
        return Err(AppError::bad_request("contactInfo.email is required"));
    }
    Ok(())
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
