use serde::{Deserialize, Serialize};

use crate::models::PrivacySettingsRow;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrivacySettingsResponse {
    pub resume_visible_to_contacts: bool,
    pub resume_visible_to_all_auth: bool,
    pub applications_visible_to_contacts: bool,
    pub applications_visible_to_all_auth: bool,
    pub profile_visible_to_all_auth: bool,
}

impl From<&PrivacySettingsRow> for PrivacySettingsResponse {
    fn from(row: &PrivacySettingsRow) -> Self {
        Self {
            resume_visible_to_contacts: row.resume_visible_to_contacts,
            resume_visible_to_all_auth: row.resume_visible_to_all_auth,
            applications_visible_to_contacts: row.applications_visible_to_contacts,
            applications_visible_to_all_auth: row.applications_visible_to_all_auth,
            profile_visible_to_all_auth: row.profile_visible_to_all_auth,
        }
    }
}