use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "app_role", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum AppRole {
    Applicant,
    Employer,
    Curator,
    AdminCurator,
}

impl AppRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Applicant => "applicant",
            Self::Employer => "employer",
            Self::Curator => "curator",
            Self::AdminCurator => "admin_curator",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "employer_verification_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum EmployerVerificationStatus {
    Pending,
    Verified,
    Rejected,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "verification_request_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum VerificationRequestStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "opportunity_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum OpportunityType {
    Internship,
    Vacancy,
    Mentoring,
    Event,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "work_format", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum WorkFormat {
    Office,
    Hybrid,
    Remote,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "employment_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum EmploymentType {
    FullTime,
    PartTime,
    Project,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "level", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum Level {
    Intern,
    Junior,
    Middle,
    Senior,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "publication_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum PublicationStatus {
    Draft,
    PendingModeration,
    Active,
    Planned,
    Closed,
    Rejected,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "tag_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum TagType {
    Technology,
    Level,
    Employment,
    Category,
}

#[derive(Debug, Clone, FromRow)]
pub struct UserRow {
    pub id: i64,
    pub email: String,
    pub display_name: String,
    pub password_hash: String,
    pub role: AppRole,
    pub is_active: bool,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct ApplicantProfileRow {
    pub id: i64,
    pub user_id: i64,
    pub full_name: Option<String>,
    pub university: Option<String>,
    pub study_course: Option<String>,
    pub graduation_year: Option<i32>,
    pub about: Option<String>,
    pub resume_text: Option<String>,
    pub portfolio_links: serde_json::Value,
    pub skills: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, FromRow)]
pub struct EmployerProfileRow {
    pub id: i64,
    pub user_id: i64,
    pub company_name: Option<String>,
    pub short_description: Option<String>,
    pub industry: Option<String>,
    pub website_url: Option<String>,
    pub social_links: serde_json::Value,
    pub office_photos: serde_json::Value,
    pub promo_video_url: Option<String>,
    pub city_id: Option<i64>,
    pub verification_status: EmployerVerificationStatus,
    pub verification_comment: Option<String>,
    pub verified_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
