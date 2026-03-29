use chrono::{DateTime, Utc};
use sqlx::{PgPool, Postgres, Transaction};

use crate::models::{AppRole, UserRow};

pub async fn find_user_by_email(pool: &PgPool, email: &str) -> Result<Option<UserRow>, sqlx::Error> {
    sqlx::query_as::<_, UserRow>(
        r#"
        select
            id,
            email,
            display_name,
            password_hash,
            role,
            is_active,
            last_login_at,
            created_at,
            updated_at
        from users
        where lower(email) = lower($1)
        "#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

pub async fn find_user_by_id(pool: &PgPool, user_id: i64) -> Result<Option<UserRow>, sqlx::Error> {
    sqlx::query_as::<_, UserRow>(
        r#"
        select
            id,
            email,
            display_name,
            password_hash,
            role,
            is_active,
            last_login_at,
            created_at,
            updated_at
        from users
        where id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

pub async fn insert_user(
    tx: &mut Transaction<'_, Postgres>,
    email: &str,
    display_name: &str,
    password_hash: &str,
    role: AppRole,
) -> Result<UserRow, sqlx::Error> {
    sqlx::query_as::<_, UserRow>(
        r#"
        insert into users (email, display_name, password_hash, role)
        values ($1, $2, $3, $4)
        returning
            id,
            email,
            display_name,
            password_hash,
            role,
            is_active,
            last_login_at,
            created_at,
            updated_at
        "#,
    )
    .bind(email)
    .bind(display_name)
    .bind(password_hash)
    .bind(role)
    .fetch_one(&mut **tx)
    .await
}

pub async fn create_applicant_profile(
    tx: &mut Transaction<'_, Postgres>,
    user_id: i64,
    display_name: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        insert into applicant_profiles (user_id, full_name)
        values ($1, $2)
        "#,
    )
    .bind(user_id)
    .bind(display_name)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn create_employer_profile(
    tx: &mut Transaction<'_, Postgres>,
    user_id: i64,
    display_name: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        insert into employer_profiles (user_id, company_name)
        values ($1, $2)
        "#,
    )
    .bind(user_id)
    .bind(display_name)
    .execute(&mut **tx)
    .await?;

    Ok(())
}

pub async fn insert_refresh_token(
    pool: &PgPool,
    user_id: i64,
    token_hash: &str,
    expires_at: DateTime<Utc>,
    user_agent: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        insert into refresh_tokens (user_id, token_hash, expires_at, user_agent)
        values ($1, $2, $3, $4)
        "#,
    )
    .bind(user_id)
    .bind(token_hash)
    .bind(expires_at)
    .bind(user_agent)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn update_last_login(pool: &PgPool, user_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        update users
        set last_login_at = now()
        where id = $1
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(())
}