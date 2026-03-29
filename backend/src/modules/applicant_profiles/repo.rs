use sqlx::PgPool;

use crate::models::ApplicantProfileRow;

pub async fn find_by_user_id(pool: &PgPool, user_id: i64) -> Result<Option<ApplicantProfileRow>, sqlx::Error> {
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
        where user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

pub async fn update_profile(
    pool: &PgPool,
    user_id: i64,
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
        where user_id = $1
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
    .bind(user_id)
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
