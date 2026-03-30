use serde::{Deserialize, Serialize};

use crate::models::{AppRole, UserRow};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub display_name: String,
    pub role: RegisterRole,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RegisterRole {
    Applicant,
    Employer,
}

impl From<RegisterRole> for AppRole {
    fn from(value: RegisterRole) -> Self {
        match value {
            RegisterRole::Applicant => AppRole::Applicant,
            RegisterRole::Employer => AppRole::Employer,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogoutRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MeResponse {
    pub id: i64,
    pub email: String,
    pub display_name: String,
    pub role: AppRole,
}

impl From<&UserRow> for MeResponse {
    fn from(user: &UserRow) -> Self {
        Self {
            id: user.id,
            email: user.email.clone(),
            display_name: user.display_name.clone(),
            role: user.role,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: MeResponse,
}