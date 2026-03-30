use sqlx::{PgPool, Postgres, Transaction};

use crate::{models::{CuratorProfileRow, UserRow, AppRole}, auth::repo};

pub async fn insert_curator_user(
    tx: &mut Transaction<'_, Postgres>,
    email: &str,
    display_name: &str,
    password_hash: &str,
    role: AppRole,
) -> Result<UserRow, sqlx::Error> {
    repo::insert_user(tx, email, display_name, password_hash, role).await
}

pub async fn insert_curator_profile(
    tx: &mut Transaction<'_, Postgres>,
    user_id: i64,
    full_name: &str,
    position: Option<&str>,
) -> Result<CuratorProfileRow, sqlx::Error> {
    sqlx::query_as::<_, CuratorProfileRow>(
        r#"
        insert into curator_profiles (user_id, full_name, position)
        values ($1, $2, $3)
        returning id, user_id, full_name, position, created_at
        "#,
    )
    .bind(user_id)
    .bind(full_name)
    .bind(position)
    .fetch_one(&mut **tx)
    .await
}

pub async fn find_curator_profile_by_user_id(pool: &PgPool, user_id: i64) -> Result<Option<CuratorProfileRow>, sqlx::Error> {
    sqlx::query_as::<_, CuratorProfileRow>(
        r#"
        select id, user_id, full_name, position, created_at
        from curator_profiles
        where user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}
