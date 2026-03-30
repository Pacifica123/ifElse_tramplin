use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::{
    models::EventRegistrationStatus,
    modules::opportunities::dto::OpportunitySummaryResponse,
};

fn default_upcoming_only() -> bool {
    true
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EventRegistrationListQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub status: Option<EventRegistrationStatus>,
    pub q: Option<String>,
    #[serde(default = "default_upcoming_only")]
    pub upcoming_only: bool,
}

impl EventRegistrationListQuery {
    pub fn page(&self) -> i64 {
        i64::from(self.page.unwrap_or(1).max(1))
    }

    pub fn per_page(&self) -> i64 {
        i64::from(self.per_page.unwrap_or(20).clamp(1, 100))
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EventRegistrationResponse {
    pub id: i64,
    pub opportunity_id: i64,
    pub applicant_profile_id: i64,
    pub status: EventRegistrationStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub cancelled_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EventRegistrationListItemResponse {
    pub registration: EventRegistrationResponse,
    pub opportunity: OpportunitySummaryResponse,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedEventRegistrationListResponse {
    pub items: Vec<EventRegistrationListItemResponse>,
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
}
