use sqlx::PgPool;

use crate::{
    error::{AppError, AppResult},
    modules::applicant_profiles::repo as applicant_repo,
};

use super::{
    dto::PrivacySettingsResponse,
    repo,
};

pub async fn get_my_privacy_settings(
    pool: &PgPool,
    user_id: i64,
) -> AppResult<PrivacySettingsResponse> {
    let applicant = applicant_repo::find_by_user_id(pool, user_id)
        .await?
        .ok_or_else(|| AppError::forbidden("Applicant profile is required"))?;

    let row = match repo::find_by_applicant_profile_id(pool, applicant.id).await? {
        Some(row) => row,
        None => repo::insert_default(pool, applicant.id).await?,
    };

    Ok(PrivacySettingsResponse::from(&row))
}

pub async fn update_my_privacy_settings(
    pool: &PgPool,
    user_id: i64,
    req: PrivacySettingsResponse,
) -> AppResult<PrivacySettingsResponse> {
    let applicant = applicant_repo::find_by_user_id(pool, user_id)
        .await?
        .ok_or_else(|| AppError::forbidden("Applicant profile is required"))?;

    if repo::find_by_applicant_profile_id(pool, applicant.id).await?.is_none() {
        let _ = repo::insert_default(pool, applicant.id).await?;
    }

    let row = repo::update_settings(
        pool,
        applicant.id,
        req.resume_visible_to_contacts,
        req.resume_visible_to_all_auth,
        req.applications_visible_to_contacts,
        req.applications_visible_to_all_auth,
        req.profile_visible_to_all_auth,
    )
    .await?;

    Ok(PrivacySettingsResponse::from(&row))
}