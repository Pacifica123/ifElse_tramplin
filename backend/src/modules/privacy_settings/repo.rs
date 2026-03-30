use sqlx::PgPool;

use crate::models::PrivacySettingsRow;

pub async fn find_by_applicant_profile_id(
    pool: &PgPool,
    applicant_profile_id: i64,
) -> Result<Option<PrivacySettingsRow>, sqlx::Error> {
    sqlx::query_as::<_, PrivacySettingsRow>(
        r#"
        select
            id,
            applicant_profile_id,
            resume_visible_to_contacts,
            resume_visible_to_all_auth,
            applications_visible_to_contacts,
            applications_visible_to_all_auth,
            profile_visible_to_all_auth,
            updated_at
        from privacy_settings
        where applicant_profile_id = $1
        "#,
    )
    .bind(applicant_profile_id)
    .fetch_optional(pool)
    .await
}

pub async fn insert_default(
    pool: &PgPool,
    applicant_profile_id: i64,
) -> Result<PrivacySettingsRow, sqlx::Error> {
    sqlx::query_as::<_, PrivacySettingsRow>(
        r#"
        insert into privacy_settings (applicant_profile_id)
        values ($1)
        returning
            id,
            applicant_profile_id,
            resume_visible_to_contacts,
            resume_visible_to_all_auth,
            applications_visible_to_contacts,
            applications_visible_to_all_auth,
            profile_visible_to_all_auth,
            updated_at
        "#,
    )
    .bind(applicant_profile_id)
    .fetch_one(pool)
    .await
}

pub async fn update_settings(
    pool: &PgPool,
    applicant_profile_id: i64,
    resume_visible_to_contacts: bool,
    resume_visible_to_all_auth: bool,
    applications_visible_to_contacts: bool,
    applications_visible_to_all_auth: bool,
    profile_visible_to_all_auth: bool,
) -> Result<PrivacySettingsRow, sqlx::Error> {
    sqlx::query_as::<_, PrivacySettingsRow>(
        r#"
        update privacy_settings
        set
            resume_visible_to_contacts = $2,
            resume_visible_to_all_auth = $3,
            applications_visible_to_contacts = $4,
            applications_visible_to_all_auth = $5,
            profile_visible_to_all_auth = $6
        where applicant_profile_id = $1
        returning
            id,
            applicant_profile_id,
            resume_visible_to_contacts,
            resume_visible_to_all_auth,
            applications_visible_to_contacts,
            applications_visible_to_all_auth,
            profile_visible_to_all_auth,
            updated_at
        "#,
    )
    .bind(applicant_profile_id)
    .bind(resume_visible_to_contacts)
    .bind(resume_visible_to_all_auth)
    .bind(applications_visible_to_contacts)
    .bind(applications_visible_to_all_auth)
    .bind(profile_visible_to_all_auth)
    .fetch_one(pool)
    .await
}