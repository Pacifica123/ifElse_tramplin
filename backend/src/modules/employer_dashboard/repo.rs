use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};

use crate::models::VerificationRequestStatus;

#[derive(Debug, Clone, FromRow)]
pub struct VerificationRequestRow {
    pub id: i64,
    pub employer_profile_id: i64,
    pub status: VerificationRequestStatus,
    pub comment: Option<String>,
    pub submitted_at: DateTime<Utc>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub reviewed_by_curator_id: Option<i64>,
}

pub async fn find_current_by_user_id(
    pool: &PgPool,
    user_id: i64,
) -> Result<Option<VerificationRequestRow>, sqlx::Error> {
    sqlx::query_as::<_, VerificationRequestRow>(
        r#"
        select
            vr.id,
            vr.employer_profile_id,
            vr.status,
            vr.comment,
            vr.submitted_at,
            vr.reviewed_at,
            vr.reviewed_by_curator_id
        from verification_requests vr
        join employer_profiles ep on ep.id = vr.employer_profile_id
        where ep.user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

pub async fn create_for_employer_profile(
    pool: &PgPool,
    employer_profile_id: i64,
    comment: Option<&str>,
) -> Result<VerificationRequestRow, sqlx::Error> {
    sqlx::query_as::<_, VerificationRequestRow>(
        r#"
        insert into verification_requests (
            employer_profile_id,
            status,
            comment
        )
        values ($1, 'pending', $2)
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
    .bind(employer_profile_id)
    .bind(comment)
    .fetch_one(pool)
    .await
}
