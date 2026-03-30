use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::models::ApplicantProfileRow;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ApplicantProfileVisibilityScope {
    Owner,
    EmployerApplicationAccess,
    Contact,
    AllAuthorized,
    Hidden,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicantProfileViewResponse {
    pub id: i64,
    pub user_id: i64,
    pub full_name: String,
    pub university: Option<String>,
    pub study_course: Option<String>,
    pub graduation_year: Option<i32>,
    pub about: Option<String>,
    pub resume_text: Option<String>,
    pub portfolio_links: Vec<String>,
    pub skills: Vec<String>,
    pub visibility_scope: ApplicantProfileVisibilityScope,
    pub career_interests_visible: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicantProfileUpdateRequest {
    pub full_name: Option<String>,
    pub university: Option<String>,
    pub study_course: Option<String>,
    pub graduation_year: Option<i32>,
    pub about: Option<String>,
    pub resume_text: Option<String>,
    pub portfolio_links: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicantProfileResponse {
    pub id: i64,
    pub user_id: i64,
    pub full_name: String,
    pub university: Option<String>,
    pub study_course: Option<String>,
    pub graduation_year: Option<i32>,
    pub about: Option<String>,
    pub resume_text: Option<String>,
    pub portfolio_links: Vec<String>,
    pub skills: Vec<String>,
}

impl From<ApplicantProfileRow> for ApplicantProfileResponse {
    fn from(row: ApplicantProfileRow) -> Self {
        Self {
            id: row.id,
            user_id: row.user_id,
            full_name: row.full_name.unwrap_or_default(),
            university: row.university,
            study_course: row.study_course,
            graduation_year: row.graduation_year,
            about: row.about,
            resume_text: row.resume_text,
            portfolio_links: json_value_to_vec_string(&row.portfolio_links),
            skills: json_value_to_vec_string(&row.skills),
        }
    }
}

fn json_value_to_vec_string(value: &Value) -> Vec<String> {
    match value {
        Value::Array(items) => items
            .iter()
            .filter_map(|v| v.as_str().map(ToOwned::to_owned))
            .collect(),
        _ => Vec::new(),
    }
}