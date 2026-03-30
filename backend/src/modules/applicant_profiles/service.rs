use sqlx::PgPool;

use crate::{
    error::{AppError, AppResult},
    models::{ApplicantProfileRow, ContactStatus},
    modules::{
        applications::repo as applications_repo,
        contacts::repo as contacts_repo,
        employer_profiles::repo as employer_repo,
        privacy_settings::{dto::PrivacySettingsResponse, repo as privacy_repo},
    },
};

use super::{
    dto::{
        ApplicantProfileUpdateRequest,
        ApplicantProfileViewResponse,
        ApplicantProfileVisibilityScope,
    },
    repo,
};

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


pub async fn get_visible_profile_for_employer(
    pool: &PgPool,
    employer_user_id: i64,
    applicant_profile_id: i64,
) -> AppResult<ApplicantProfileViewResponse> {
    employer_repo::find_by_user_id(pool, employer_user_id)
        .await?
        .ok_or_else(|| AppError::forbidden("Employer profile not found"))?;

    let profile = repo::find_by_id(pool, applicant_profile_id)
        .await?
        .ok_or_else(|| AppError::not_found("Applicant profile not found"))?;

    let has_access = applications_repo::employer_has_application_from_applicant(
        pool,
        employer_user_id,
        applicant_profile_id,
    )
    .await?;

    if !has_access {
        return Err(AppError::forbidden(
            "Employer can view only applicants who responded to own opportunities",
        ));
    }

    Ok(ApplicantProfileViewResponse {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name.clone().unwrap_or_default(),
        university: profile.university.clone(),
        study_course: profile.study_course.clone(),
        graduation_year: profile.graduation_year,
        about: profile.about.clone(),
        resume_text: profile.resume_text.clone(),
        portfolio_links: json_value_to_vec_string(&profile.portfolio_links),
        skills: json_value_to_vec_string(&profile.skills),
        visibility_scope: ApplicantProfileVisibilityScope::EmployerApplicationAccess,
        career_interests_visible: false,
    })
}

pub async fn get_visible_profile(
    pool: &PgPool,
    viewer_user_id: i64,
    applicant_profile_id: i64,
) -> AppResult<ApplicantProfileViewResponse> {
    let profile = repo::find_by_id(pool, applicant_profile_id)
        .await?
        .ok_or_else(|| AppError::not_found("Applicant profile not found"))?;

    let privacy = get_or_create_privacy_settings(pool, profile.id).await?;

    let is_owner = viewer_user_id == profile.user_id;

    let is_contact = if is_owner {
        false
    } else {
        contacts_repo::find_pair_contact(pool, viewer_user_id, profile.user_id)
            .await?
            .map(|c| c.status == ContactStatus::Accepted)
            .unwrap_or(false)
    };

    let scope = if is_owner {
        ApplicantProfileVisibilityScope::Owner
    } else if is_contact {
        ApplicantProfileVisibilityScope::Contact
    } else if privacy.profile_visible_to_all_auth {
        ApplicantProfileVisibilityScope::AllAuthorized
    } else {
        ApplicantProfileVisibilityScope::Hidden
    };

    if matches!(scope, ApplicantProfileVisibilityScope::Hidden) {
        return Err(AppError::forbidden("Applicant profile is hidden by privacy settings"));
    }

    let resume_visible = match scope {
        ApplicantProfileVisibilityScope::Owner => true,
        ApplicantProfileVisibilityScope::EmployerApplicationAccess => true,
        ApplicantProfileVisibilityScope::Contact => privacy.resume_visible_to_contacts,
        ApplicantProfileVisibilityScope::AllAuthorized => privacy.resume_visible_to_all_auth,
        ApplicantProfileVisibilityScope::Hidden => false,
    };

    let career_interests_visible = match scope {
        ApplicantProfileVisibilityScope::Owner => true,
        ApplicantProfileVisibilityScope::EmployerApplicationAccess => false,
        ApplicantProfileVisibilityScope::Contact => privacy.applications_visible_to_contacts,
        ApplicantProfileVisibilityScope::AllAuthorized => false,
        ApplicantProfileVisibilityScope::Hidden => false,
    };

    Ok(ApplicantProfileViewResponse {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name.clone().unwrap_or_default(),
        university: profile.university.clone(),
        study_course: profile.study_course.clone(),
        graduation_year: profile.graduation_year,
        about: profile.about.clone(),
        resume_text: if resume_visible {
            profile.resume_text.clone()
        } else {
            None
        },
        portfolio_links: if resume_visible {
            json_value_to_vec_string(&profile.portfolio_links)
        } else {
            Vec::new()
        },
        skills: json_value_to_vec_string(&profile.skills),
        visibility_scope: scope,
        career_interests_visible,
    })
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