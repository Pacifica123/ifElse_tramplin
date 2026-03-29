use serde::Serialize;

use crate::models::TagType;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TagResponse {
    pub id: i64,
    pub name: String,
    pub tag_type: TagType,
    pub is_system: bool,
    pub is_active: bool,
}
