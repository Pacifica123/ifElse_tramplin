use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::{
    models::{EmployerVerificationStatus, OpportunityType, PublicationStatus, VerificationRequestStatus, EmploymentType, Level, WorkFormat},
    modules::{
        applicant_profiles::dto::ApplicantProfileResponse,
        employer_profiles::dto::EmployerProfileResponse,
        opportunities::dto::{OpportunityDetailsResponse, OpportunitySummaryResponse},
    },
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerificationRequestResponse {
    pub id: i64,
    pub employer_profile_id: i64,
    pub status: VerificationRequestStatus,
    pub comment: Option<String>,
    pub submitted_at: DateTime<Utc>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub reviewed_by_curator_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerificationRequestUpdateRequest {
    pub status: VerificationRequestStatus,
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CuratorEmployerProfilesQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub q: Option<String>,
    pub verification_status: Option<EmployerVerificationStatus>,
}
impl CuratorEmployerProfilesQuery {
    pub fn page(&self) -> i64 { i64::from(self.page.unwrap_or(1).max(1)) }
    pub fn per_page(&self) -> i64 { i64::from(self.per_page.unwrap_or(20).clamp(1, 100)) }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CuratorEmployerProfileUpdateRequest {
    pub company_name: Option<String>,
    pub short_description: Option<String>,
    pub industry: Option<String>,
    pub website_url: Option<String>,
    pub social_links: Option<Vec<String>>,
    pub office_photos: Option<Vec<String>>,
    pub promo_video_url: Option<String>,
    pub city_id: Option<i64>,
    pub verification_status: Option<EmployerVerificationStatus>,
    pub verification_comment: Option<String>,
    pub verified_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CuratorApplicantProfilesQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub q: Option<String>,
    pub university: Option<String>,
}
impl CuratorApplicantProfilesQuery {
    pub fn page(&self) -> i64 { i64::from(self.page.unwrap_or(1).max(1)) }
    pub fn per_page(&self) -> i64 { i64::from(self.per_page.unwrap_or(20).clamp(1, 100)) }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CuratorApplicantProfileUpdateRequest {
    pub full_name: Option<String>,
    pub university: Option<String>,
    pub study_course: Option<String>,
    pub graduation_year: Option<i32>,
    pub about: Option<String>,
    pub resume_text: Option<String>,
    pub portfolio_links: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CuratorOpportunitiesQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub q: Option<String>,
    pub publication_status: Option<PublicationStatus>,
    pub opportunity_type: Option<OpportunityType>,
}
impl CuratorOpportunitiesQuery {
    pub fn page(&self) -> i64 { i64::from(self.page.unwrap_or(1).max(1)) }
    pub fn per_page(&self) -> i64 { i64::from(self.per_page.unwrap_or(20).clamp(1, 100)) }
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CuratorOpportunityUpdateRequest {
    pub title: Option<String>,
    pub short_description: Option<String>,
    pub full_description: Option<String>,
    pub work_format: Option<WorkFormat>,
    pub employment_type: Option<EmploymentType>,
    pub level: Option<Level>,
    pub city_id: Option<i64>,
    pub address_id: Option<i64>,
    pub salary_from: Option<i32>,
    pub salary_to: Option<i32>,
    pub expires_at: Option<DateTime<Utc>>,
    pub event_date: Option<DateTime<Utc>>,
    pub tag_ids: Option<Vec<i64>>,
    pub contact_info: Option<serde_json::Value>,
    pub resource_links: Option<Vec<String>>,
    pub media: Option<Vec<String>>,
    pub publication_status: Option<PublicationStatus>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedEmployerProfilesResponse {
    pub items: Vec<EmployerProfileResponse>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedApplicantProfilesResponse {
    pub items: Vec<ApplicantProfileResponse>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedOpportunitiesResponse {
    pub items: Vec<OpportunitySummaryResponse>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpportunityForModerationResponse {
    #[serde(flatten)]
    pub opportunity: OpportunityDetailsResponse,
}


pub fn map_verification_request_response(row: crate::modules::employer_dashboard::repo::VerificationRequestRow) -> VerificationRequestResponse {
    VerificationRequestResponse {
        id: row.id,
        employer_profile_id: row.employer_profile_id,
        status: row.status,
        comment: row.comment,
        submitted_at: row.submitted_at,
        reviewed_at: row.reviewed_at,
        reviewed_by_curator_id: row.reviewed_by_curator_id,
    }
}
