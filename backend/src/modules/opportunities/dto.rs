use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::models::{EmploymentType, Level, OpportunityType, PublicationStatus, WorkFormat};

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct OpportunityListQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub q: Option<String>,
    pub city_id: Option<i64>,
    pub work_format: Option<WorkFormat>,
    pub opportunity_type: Option<OpportunityType>,
    pub level: Option<Level>,
    pub employment_type: Option<EmploymentType>,
    pub tag_ids: Option<String>,
    pub salary_from: Option<i32>,
    pub salary_to: Option<i32>,
}

impl OpportunityListQuery {
    pub fn page(&self) -> i64 {
        i64::from(self.page.unwrap_or(1).max(1))
    }

    pub fn per_page(&self) -> i64 {
        i64::from(self.per_page.unwrap_or(20).clamp(1, 100))
    }

    pub fn parsed_tag_ids(&self) -> Result<Vec<i64>, String> {
        let Some(raw) = &self.tag_ids else {
            return Ok(vec![]);
        };

        let mut out = Vec::new();
        for part in raw.split(',') {
            let trimmed = part.trim();
            if trimmed.is_empty() {
                continue;
            }
            out.push(
                trimmed
                    .parse::<i64>()
                    .map_err(|_| format!("Invalid tag id: {trimmed}"))?,
            );
        }
        Ok(out)
    }
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EmployerOwnOpportunityListQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub q: Option<String>,
    pub publication_status: Option<PublicationStatus>,
    pub work_format: Option<WorkFormat>,
    pub opportunity_type: Option<OpportunityType>,
}

impl EmployerOwnOpportunityListQuery {
    pub fn page(&self) -> i64 {
        i64::from(self.page.unwrap_or(1).max(1))
    }

    pub fn per_page(&self) -> i64 {
        i64::from(self.per_page.unwrap_or(20).clamp(1, 100))
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpportunityCreateRequest {
    pub title: String,
    pub short_description: String,
    pub full_description: String,
    pub opportunity_type: OpportunityType,
    pub work_format: WorkFormat,
    pub employment_type: Option<EmploymentType>,
    pub level: Option<Level>,
    pub city_id: Option<i64>,
    pub address_id: Option<i64>,
    pub salary_from: Option<i32>,
    pub salary_to: Option<i32>,
    pub published_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub event_date: Option<DateTime<Utc>>,
    pub tag_ids: Vec<i64>,
    pub contact_info: Value,
    pub resource_links: Option<Vec<String>>,
    pub media: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct OpportunityUpdateRequest {
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
    pub published_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub event_date: Option<DateTime<Utc>>,
    pub tag_ids: Option<Vec<i64>>,
    pub contact_info: Option<Value>,
    pub resource_links: Option<Vec<String>>,
    pub media: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpportunityStatusUpdateRequest {
    pub publication_status: PublicationStatus,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedOpportunityListResponse {
    pub items: Vec<OpportunitySummaryResponse>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpportunitySummaryResponse {
    pub id: i64,
    pub title: String,
    pub short_description: Option<String>,
    pub employer_profile_id: i64,
    pub employer_name: Option<String>,
    pub opportunity_type: OpportunityType,
    pub work_format: WorkFormat,
    pub publication_status: PublicationStatus,
    pub city_id: Option<i64>,
    pub address_id: Option<i64>,
    pub salary_from: Option<i32>,
    pub salary_to: Option<i32>,
    pub tag_ids: Vec<i64>,
    pub city_name: Option<String>,
    pub address_text: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpportunityDetailsResponse {
    pub id: i64,
    pub title: String,
    pub short_description: Option<String>,
    pub employer_profile_id: i64,
    pub employer_name: Option<String>,
    pub opportunity_type: OpportunityType,
    pub work_format: WorkFormat,
    pub publication_status: PublicationStatus,
    pub city_id: Option<i64>,
    pub address_id: Option<i64>,
    pub salary_from: Option<i32>,
    pub salary_to: Option<i32>,
    pub tag_ids: Vec<i64>,
    pub city_name: Option<String>,
    pub address_text: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub is_favorite: Option<bool>,
    pub full_description: Option<String>,
    pub employment_type: Option<EmploymentType>,
    pub level: Option<Level>,
    pub published_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub event_date: Option<DateTime<Utc>>,
    pub contact_info: Value,
    pub resource_links: Vec<String>,
    pub media: Vec<String>,
}
