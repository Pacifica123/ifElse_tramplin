use sqlx::PgPool;

use crate::{
    error::{AppError, AppResult},
    models::{AppRole, ApplicationRow, ApplicationStatus, OpportunityType, PublicationStatus, UserRow},
    modules::{
        applicant_profiles::repo as applicant_repo,
        employer_profiles::repo as employer_repo,
    },
};

use super::{
    dto::{
        ApplicationCreateRequest, ApplicationStatusUpdateRequest, EmployerOpportunityApplicationsQuery,
        MyApplicationsQuery,
    },
    repo::{self, EmployerApplicationRow},
};

pub async fn create_application(
    pool: &PgPool,
    user: &UserRow,
    opportunity_id: i64,
    req: ApplicationCreateRequest,
) -> AppResult<ApplicationRow> {
    ensure_role(user, AppRole::Applicant, "Only applicants can apply to opportunities")?;

    let applicant_profile = applicant_repo::find_by_user_id(pool, user.id)
        .await?
        .ok_or_else(|| AppError::forbidden("Applicant profile not found"))?;

    let target = repo::find_apply_target_by_id(pool, opportunity_id)
        .await?
        .ok_or_else(|| AppError::not_found("Opportunity not found"))?;

    if target.opportunity_type == OpportunityType::Event {
        return Err(AppError::bad_request("Event opportunities use event registration flow"));
    }

    if target.publication_status != PublicationStatus::Active {
        return Err(AppError::forbidden("Only active opportunities accept applications"));
    }

    let cover_letter = req.cover_letter.as_deref().map(str::trim);
    if let Some(letter) = cover_letter {
        if letter.len() > 5000 {
            return Err(AppError::bad_request("coverLetter must be at most 5000 characters"));
        }
    }

    if repo::find_application_by_opportunity_and_applicant(pool, opportunity_id, applicant_profile.id)
        .await?
        .is_some()
    {
        return Err(AppError::conflict("Application already exists for this opportunity"));
    }

    let mut tx = pool.begin().await?;
    let created = repo::insert_application(&mut tx, opportunity_id, applicant_profile.id, cover_letter)
        .await
        .map_err(map_insert_error)?;
    tx.commit().await?;

    Ok(created)
}

pub async fn list_my_applications(
    pool: &PgPool,
    user: &UserRow,
    query: &MyApplicationsQuery,
) -> AppResult<(Vec<ApplicationRow>, i64)> {
    ensure_role(user, AppRole::Applicant, "Only applicants can view their applications")?;

    let applicant_profile = applicant_repo::find_by_user_id(pool, user.id)
        .await?
        .ok_or_else(|| AppError::forbidden("Applicant profile not found"))?;

    repo::list_my_applications(pool, applicant_profile.id, query)
        .await
        .map_err(AppError::from)
}

pub async fn list_employer_applications_for_opportunity(
    pool: &PgPool,
    user: &UserRow,
    opportunity_id: i64,
    query: &EmployerOpportunityApplicationsQuery,
) -> AppResult<(Vec<EmployerApplicationRow>, i64)> {
    ensure_role(user, AppRole::Employer, "Only employers can view opportunity applications")?;

    let employer_profile = employer_repo::find_by_user_id(pool, user.id)
        .await?
        .ok_or_else(|| AppError::forbidden("Employer profile not found"))?;

    let owned = repo::find_owned_opportunity(pool, employer_profile.user_id, opportunity_id).await?;
    if owned.is_none() {
        return Err(AppError::not_found("Opportunity not found"));
    }

    repo::list_employer_applications_for_opportunity(pool, employer_profile.user_id, opportunity_id, query)
        .await
        .map_err(AppError::from)
}

pub async fn update_application_status(
    pool: &PgPool,
    user: &UserRow,
    application_id: i64,
    req: ApplicationStatusUpdateRequest,
) -> AppResult<ApplicationRow> {
    ensure_role(user, AppRole::Employer, "Only employers can update application status")?;

    let employer_profile = employer_repo::find_by_user_id(pool, user.id)
        .await?
        .ok_or_else(|| AppError::forbidden("Employer profile not found"))?;

    let existing = repo::get_employer_application_by_id(pool, employer_profile.user_id, application_id)
        .await?
        .ok_or_else(|| AppError::not_found("Application not found"))?;

    if matches!(req.status, ApplicationStatus::Pending) && existing.status != ApplicationStatus::Pending {
        // Разрешаем возврат в pending, но явно не запрещаем. Этот блок оставлен на будущее.
    }

    repo::update_application_status(pool, application_id, req.status).await?;

    repo::find_application_by_opportunity_and_applicant(pool, existing.opportunity_id, existing.applicant_profile_id)
        .await?
        .ok_or_else(|| AppError::not_found("Application not found after update"))
}

fn ensure_role(user: &UserRow, required: AppRole, message: &str) -> AppResult<()> {
    if user.role != required {
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
            return AppError::conflict("Application already exists for this opportunity");
        }
    }

    AppError::from(err)
}
