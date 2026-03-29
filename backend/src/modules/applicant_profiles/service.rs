use sqlx::PgPool;

use crate::{
    error::{AppError, AppResult},
    models::ApplicantProfileRow,
};

use super::{dto::ApplicantProfileUpdateRequest, repo};

pub async fn get_current_profile(pool: &PgPool, user_id: i64) -> AppResult<ApplicantProfileRow> {
    repo::find_by_user_id(pool, user_id)
        .await?
        .ok_or_else(|| AppError::not_found("Applicant profile not found"))
}

pub async fn update_current_profile(
    pool: &PgPool,
    user_id: i64,
    req: ApplicantProfileUpdateRequest,
) -> AppResult<ApplicantProfileRow> {
    let current = get_current_profile(pool, user_id).await?;

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

    repo::update_profile(
        pool,
        user_id,
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

fn clean_non_empty(value: String) -> String {
    value.trim().to_string()
}

fn clean_nullable(value: String) -> String {
    value.trim().to_string()
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