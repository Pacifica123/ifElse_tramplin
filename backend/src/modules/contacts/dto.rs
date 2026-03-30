use serde::{Deserialize, Serialize};

use crate::models::{ContactRow, ContactStatus};

use chrono::{DateTime, Utc};

use crate::models::OpportunityType;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContactRequestCreateRequest {
    pub addressee_user_id: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContactStatusUpdateRequest {
    pub status: ContactStatus,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContactResponse {
    pub id: i64,
    pub requester_user_id: i64,
    pub addressee_user_id: i64,
    pub status: ContactStatus,
}

impl From<ContactRow> for ContactResponse {
    fn from(row: ContactRow) -> Self {
        Self {
            id: row.id,
            requester_user_id: row.requester_user_id,
            addressee_user_id: row.addressee_user_id,
            status: row.status,
        }
    }
}


#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum CareerInterestType {
    Applied,
    Favorited,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CareerInterestResponse {
    pub r#type: CareerInterestType,
    pub opportunity_id: i64,
    pub opportunity_title: String,
    pub opportunity_type: crate::models::OpportunityType,
    pub employer_name: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

