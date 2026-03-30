use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::models::ApplicationStatus;

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MyApplicationsQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

impl MyApplicationsQuery {
    pub fn page(&self) -> i64 {
        i64::from(self.page.unwrap_or(1).max(1))
    }

    pub fn per_page(&self) -> i64 {
        i64::from(self.per_page.unwrap_or(20).clamp(1, 100))
    }
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EmployerOpportunityApplicationsQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub status: Option<ApplicationStatus>,
    pub q: Option<String>,
}

impl EmployerOpportunityApplicationsQuery {
    pub fn page(&self) -> i64 {
        i64::from(self.page.unwrap_or(1).max(1))
    }

    pub fn per_page(&self) -> i64 {
        i64::from(self.per_page.unwrap_or(20).clamp(1, 100))
    }
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationCreateRequest {
    pub cover_letter: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationStatusUpdateRequest {
    pub status: ApplicationStatus,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationResponse {
    pub id: i64,
    pub opportunity_id: i64,
    pub applicant_profile_id: i64,
    pub status: ApplicationStatus,
    pub cover_letter: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedApplicationListResponse {
    pub items: Vec<ApplicationResponse>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmployerApplicationApplicantResponse {
    pub id: i64,
    pub full_name: String,
    pub university: Option<String>,
    pub study_course: Option<String>,
    pub graduation_year: Option<i32>,
    pub about: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmployerApplicationResponse {
    pub id: i64,
    pub opportunity_id: i64,
    pub applicant_profile_id: i64,
    pub status: ApplicationStatus,
    pub cover_letter: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub applicant: EmployerApplicationApplicantResponse,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedEmployerApplicationListResponse {
    pub items: Vec<EmployerApplicationResponse>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}
