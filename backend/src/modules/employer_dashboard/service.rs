use sqlx::PgPool;

use crate::{
    error::{AppError, AppResult},
    models::EmployerVerificationStatus,
    modules::employer_profiles::repo as employer_repo,
};

use super::{dto::VerificationRequestCreateRequest, repo};

pub async fn get_current_verification_request(
    pool: &PgPool,
    user_id: i64,
) -> AppResult<repo::VerificationRequestRow> {
    repo::find_current_by_user_id(pool, user_id)
        .await?
        .ok_or_else(|| AppError::not_found("Verification request not found"))
}

pub async fn create_current_verification_request(
    pool: &PgPool,
    user_id: i64,
    req: VerificationRequestCreateRequest,
) -> AppResult<repo::VerificationRequestRow> {
    let employer_profile = employer_repo::find_by_user_id(pool, user_id)
        .await?
        .ok_or_else(|| AppError::forbidden("Employer profile not found"))?;

    if employer_profile.verification_status == EmployerVerificationStatus::Verified {
        return Err(AppError::conflict("Employer is already verified"));
    }

    if repo::find_current_by_user_id(pool, user_id).await?.is_some() {
        return Err(AppError::conflict("Verification request already exists"));
    }

    let comment = req.comment.and_then(|value| {
        let trimmed = value.trim().to_string();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
        }
    });

    repo::create_for_employer_profile(pool, employer_profile.id, comment.as_deref())
        .await
        .map_err(AppError::from)
}
