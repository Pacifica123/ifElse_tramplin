use sqlx::PgPool;

use crate::{
    error::{AppError, AppResult},
    models::{
        AppRole, EventRegistrationRow, EventRegistrationStatus, PublicationStatus, UserRow,
    },
    modules::applicant_profiles::repo as applicant_repo,
};

use super::{
    dto::EventRegistrationListQuery,
    repo::{self, EventRegistrationListItemRow},
};

pub async fn register_for_event(
    pool: &PgPool,
    user: &UserRow,
    opportunity_id: i64,
) -> AppResult<EventRegistrationRow> {
    ensure_applicant(user, "Only applicants can register for events")?;

    let applicant_profile = applicant_repo::find_by_user_id(pool, user.id)
        .await?
        .ok_or_else(|| AppError::forbidden("Applicant profile not found"))?;

    let target = repo::find_event_target_by_id(pool, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found"))?;

    if !matches!(target.opportunity_type, crate::models::OpportunityType::Event) {
        return Err(AppError::bad_request("Opportunity is not an event"));
    }

    if target.publication_status != PublicationStatus::Active {
        return Err(AppError::forbidden("Only active event opportunities accept registrations"));
    }

    if let Some(existing) = repo::find_registration_by_opportunity_and_applicant(pool, opportunity_id, applicant_profile.id).await? {
        return match existing.status {
            EventRegistrationStatus::Registered => Err(AppError::conflict("Event registration already exists for this opportunity")),
            EventRegistrationStatus::Cancelled => repo::reactivate_registration(pool, existing.id).await.map_err(AppError::from),
        };
    }

    let mut tx = pool.begin().await?;
    let created = repo::insert_registration(&mut tx, opportunity_id, applicant_profile.id)
        .await
        .map_err(map_insert_error)?;
    tx.commit().await?;

    Ok(created)
}

pub async fn cancel_event_registration(
    pool: &PgPool,
    user: &UserRow,
    opportunity_id: i64,
) -> AppResult<()> {
    ensure_applicant(user, "Only applicants can cancel event registrations")?;

    let applicant_profile = applicant_repo::find_by_user_id(pool, user.id)
        .await?
        .ok_or_else(|| AppError::forbidden("Applicant profile not found"))?;

    let target = repo::find_event_target_by_id(pool, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found"))?;

    if !matches!(target.opportunity_type, crate::models::OpportunityType::Event) {
        return Err(AppError::bad_request("Opportunity is not an event"));
    }

    let existing = repo::find_registration_by_opportunity_and_applicant(pool, opportunity_id, applicant_profile.id)
        .await?
        .ok_or_else(|| AppError::not_found("Event registration not found"))?;

    if existing.status != EventRegistrationStatus::Registered {
        return Err(AppError::not_found("Event registration not found"));
    }

    repo::cancel_registration(pool, existing.id).await?;
    Ok(())
}

pub async fn list_my_event_registrations(
    pool: &PgPool,
    user: &UserRow,
    query: &EventRegistrationListQuery,
) -> AppResult<(Vec<EventRegistrationListItemRow>, i64)> {
    ensure_applicant(user, "Only applicants can view their event registrations")?;

    let applicant_profile = applicant_repo::find_by_user_id(pool, user.id)
        .await?
        .ok_or_else(|| AppError::forbidden("Applicant profile not found"))?;

    repo::list_my_event_registrations(pool, applicant_profile.id, query)
        .await
        .map_err(AppError::from)
}

fn ensure_applicant(user: &UserRow, message: &str) -> AppResult<()> {
    if user.role != AppRole::Applicant {
        return Err(AppError::forbidden(message));
    }
    if !user.is_active {
        return Err(AppError::forbidden("User is inactive"));
    }
    Ok(())
}

fn map_insert_error(err: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(db_err) = &err {
        if db_err.code().as_deref() == Some("23505") {
            return AppError::conflict("Event registration already exists for this opportunity");
        }
    }

    AppError::from(err)
}
