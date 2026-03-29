use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::models::VerificationRequestStatus;

#[derive(Debug, Clone, Serialize)]
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
pub struct VerificationRequestCreateRequest {
    pub comment: Option<String>,
}
