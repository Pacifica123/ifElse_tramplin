use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::{
    config::AuthSettings,
    error::{AppError, AppResult},
    models::UserRow,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccessClaims {
    pub sub: i64,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}

pub fn create_access_token(user: &UserRow, cfg: &AuthSettings) -> AppResult<String> {
    let now = Utc::now();
    let exp = now + Duration::minutes(cfg.access_token_ttl_minutes);

    let claims = AccessClaims {
        sub: user.id,
        role: user.role.as_str().to_string(),
        iat: now.timestamp() as usize,
        exp: exp.timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(cfg.jwt_secret.as_bytes()),
    )
    .map_err(|_| AppError::internal())
}

pub fn decode_access_token(token: &str, cfg: &AuthSettings) -> AppResult<AccessClaims> {
    let validation = Validation::new(Algorithm::HS256);

    decode::<AccessClaims>(
        token,
        &DecodingKey::from_secret(cfg.jwt_secret.as_bytes()),
        &validation,
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::unauthorized("Invalid or expired access token"))
}

pub fn generate_refresh_token() -> String {
    Uuid::new_v4().to_string()
}

pub fn hash_refresh_token(raw: &str) -> String {
    let digest = Sha256::digest(raw.as_bytes());
    format!("{:x}", digest)
}