use sqlx::PgPool;

use crate::{
    error::{AppError, AppResult},
    models::{AppRole, ContactStatus},
};
use crate::modules::{
    applicant_profiles::repo as applicant_repo,
    privacy_settings::{dto::PrivacySettingsResponse, repo as privacy_repo},
};

use super::{
    dto::{ContactRequestCreateRequest, ContactResponse, ContactStatusUpdateRequest},
    repo,
};
use super::dto::{CareerInterestResponse, CareerInterestType};

pub async fn list_contacts(
    pool: &PgPool,
    current_user_id: i64,
) -> AppResult<Vec<ContactResponse>> {
    ensure_applicant(pool, current_user_id).await?;
    let rows = repo::list_user_contacts(pool, current_user_id).await?;
    Ok(rows.into_iter().map(ContactResponse::from).collect())
}

pub async fn create_contact_request(
    pool: &PgPool,
    current_user_id: i64,
    req: ContactRequestCreateRequest,
) -> AppResult<ContactResponse> {
    ensure_applicant(pool, current_user_id).await?;

    if current_user_id == req.addressee_user_id {
        return Err(AppError::bad_request("Cannot create contact with yourself"));
    }

    ensure_applicant(pool, req.addressee_user_id).await?;

    if let Some(existing) = repo::find_pair_contact(pool, current_user_id, req.addressee_user_id).await? {
        return match existing.status {
            ContactStatus::Pending => {
                if existing.requester_user_id == req.addressee_user_id {
                    let row = repo::update_contact_status(pool, existing.id, ContactStatus::Accepted).await?;
                    Ok(ContactResponse::from(row))
                } else {
                    Err(AppError::conflict("Contact request already exists"))
                }
            }
            ContactStatus::Accepted => Err(AppError::conflict("Users are already contacts")),
            ContactStatus::Rejected => Err(AppError::conflict("Contact request already exists")),
            ContactStatus::Blocked => Err(AppError::conflict("Contact is blocked")),
        };
    }

    let row = repo::insert_contact_request(pool, current_user_id, req.addressee_user_id).await?;
    Ok(ContactResponse::from(row))
}

pub async fn update_contact_status(
    pool: &PgPool,
    current_user_id: i64,
    contact_id: i64,
    req: ContactStatusUpdateRequest,
) -> AppResult<ContactResponse> {
    ensure_applicant(pool, current_user_id).await?;

    let existing = repo::find_contact_by_id(pool, contact_id)
        .await?
        .ok_or_else(|| AppError::not_found("Contact not found"))?;

    let is_participant =
        existing.requester_user_id == current_user_id || existing.addressee_user_id == current_user_id;

    if !is_participant {
        return Err(AppError::forbidden("No access to this contact"));
    }

    match req.status {
        ContactStatus::Accepted | ContactStatus::Rejected => {
            if existing.status != ContactStatus::Pending {
                return Err(AppError::conflict("Only pending requests can be reviewed"));
            }
            if existing.addressee_user_id != current_user_id {
                return Err(AppError::forbidden("Only addressee can review pending request"));
            }
        }
        ContactStatus::Blocked => {}
        ContactStatus::Pending => {
            return Err(AppError::bad_request("Cannot move contact back to pending"));
        }
    }

    let row = repo::update_contact_status(pool, contact_id, req.status).await?;
    Ok(ContactResponse::from(row))
}

async fn ensure_applicant(pool: &PgPool, user_id: i64) -> AppResult<()> {
    let role = repo::find_user_role(pool, user_id)
        .await?
        .ok_or_else(|| AppError::not_found("User not found"))?;

    if role != AppRole::Applicant {
        return Err(AppError::forbidden("Applicant role is required"));
    }

    Ok(())
}

pub async fn get_career_interests(
    pool: &PgPool,
    viewer_user_id: i64,
    applicant_profile_id: i64,
) -> AppResult<Vec<CareerInterestResponse>> {
    let target_profile = applicant_repo::find_by_id(pool, applicant_profile_id)
        .await?
        .ok_or_else(|| AppError::not_found("Applicant profile not found"))?;

    let privacy = get_or_create_privacy_settings(pool, target_profile.id).await?;

    let is_owner = viewer_user_id == target_profile.user_id;

    let is_contact = if is_owner {
        false
    } else {
        repo::find_pair_contact(pool, viewer_user_id, target_profile.user_id)
            .await?
            .map(|c| c.status == ContactStatus::Accepted)
            .unwrap_or(false)
    };

    if !is_owner {
        if !is_contact {
            return Err(AppError::forbidden(
                "Career interests are visible only to accepted contacts",
            ));
        }

        if !privacy.applications_visible_to_contacts {
            return Err(AppError::forbidden(
                "Career interests are hidden by privacy settings",
            ));
        }
    }

    let mut items = Vec::new();

    let applied = repo::list_applied_career_interests(pool, target_profile.id).await?;
    for row in applied {
        items.push(CareerInterestResponse {
            r#type: CareerInterestType::Applied,
            opportunity_id: row.opportunity_id,
            opportunity_title: row.opportunity_title,
            opportunity_type: row.opportunity_type,
            employer_name: row.employer_name,
            created_at: row.created_at,
        });
    }

    let favorited = repo::list_favorited_career_interests(pool, target_profile.user_id).await?;
    for row in favorited {
        items.push(CareerInterestResponse {
            r#type: CareerInterestType::Favorited,
            opportunity_id: row.opportunity_id,
            opportunity_title: row.opportunity_title,
            opportunity_type: row.opportunity_type,
            employer_name: row.employer_name,
            created_at: row.created_at,
        });
    }

    items.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(items)
}

async fn get_or_create_privacy_settings(
    pool: &PgPool,
    applicant_profile_id: i64,
) -> AppResult<PrivacySettingsResponse> {
    let row = match privacy_repo::find_by_applicant_profile_id(pool, applicant_profile_id).await? {
        Some(row) => row,
        None => privacy_repo::insert_default(pool, applicant_profile_id).await?,
    };

    Ok(PrivacySettingsResponse::from(&row))
}