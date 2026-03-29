use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::models::{EmployerProfileRow, EmployerVerificationStatus};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmployerProfileUpdateRequest {
    pub company_name: Option<String>,
    pub short_description: Option<String>,
    pub industry: Option<String>,
    pub website_url: Option<String>,
    pub social_links: Option<Vec<String>>,
    pub office_photos: Option<Vec<String>>,
    pub promo_video_url: Option<String>,
    pub city_id: Option<i64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmployerProfileResponse {
    pub id: i64,
    pub user_id: i64,
    pub company_name: String,
    pub short_description: Option<String>,
    pub industry: Option<String>,
    pub website_url: Option<String>,
    pub social_links: Vec<String>,
    pub office_photos: Vec<String>,
    pub promo_video_url: Option<String>,
    pub city_id: Option<i64>,
    pub verification_status: EmployerVerificationStatus,
    pub verification_comment: Option<String>,
    pub verified_at: Option<chrono::DateTime<chrono::Utc>>,
}

impl From<EmployerProfileRow> for EmployerProfileResponse {
    fn from(row: EmployerProfileRow) -> Self {
        Self {
            id: row.id,
            user_id: row.user_id,
            company_name: row.company_name.unwrap_or_default(),
            short_description: row.short_description,
            industry: row.industry,
            website_url: row.website_url,
            social_links: json_value_to_vec_string(&row.social_links),
            office_photos: json_value_to_vec_string(&row.office_photos),
            promo_video_url: row.promo_video_url,
            city_id: row.city_id,
            verification_status: row.verification_status,
            verification_comment: row.verification_comment,
            verified_at: row.verified_at,
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