use serde::Deserialize;

use crate::models::AppRole;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCuratorRequest {
    pub email: String,
    pub password: String,
    pub display_name: String,
    pub full_name: String,
    pub position: Option<String>,
    pub role: Option<CreateCuratorRole>,
}

#[derive(Debug, Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum CreateCuratorRole {
    Curator,
    AdminCurator,
}

impl From<CreateCuratorRole> for AppRole {
    fn from(value: CreateCuratorRole) -> Self {
        match value {
            CreateCuratorRole::Curator => AppRole::Curator,
            CreateCuratorRole::AdminCurator => AppRole::AdminCurator,
        }
    }
}
