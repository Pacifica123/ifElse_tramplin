use chrono::{DateTime, Utc};

use crate::models::OpportunityType;
use sqlx::PgPool;

use crate::{
    models::{AppRole, ContactRow, ContactStatus},
};

pub async fn find_user_role(
    pool: &PgPool,
    user_id: i64,
) -> Result<Option<AppRole>, sqlx::Error> {
    let role = sqlx::query_scalar::<_, AppRole>(
        r#"
        select role as "role: AppRole"
        from users
        where id = $1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    Ok(role)
}

pub async fn find_pair_contact(
    pool: &PgPool,
    left_user_id: i64,
    right_user_id: i64,
) -> Result<Option<ContactRow>, sqlx::Error> {
    sqlx::query_as::<_, ContactRow>(
        r#"
        select
            id,
            requester_user_id,
            addressee_user_id,
            status,
            created_at,
            updated_at
        from contacts
        where least(requester_user_id, addressee_user_id) = least($1, $2)
          and greatest(requester_user_id, addressee_user_id) = greatest($1, $2)
        "#,
    )
    .bind(left_user_id)
    .bind(right_user_id)
    .fetch_optional(pool)
    .await
}

pub async fn insert_contact_request(
    pool: &PgPool,
    requester_user_id: i64,
    addressee_user_id: i64,
) -> Result<ContactRow, sqlx::Error> {
    sqlx::query_as::<_, ContactRow>(
        r#"
        insert into contacts (
            requester_user_id,
            addressee_user_id,
            status
        )
        values ($1, $2, 'pending')
        returning
            id,
            requester_user_id,
            addressee_user_id,
            status,
            created_at,
            updated_at
        "#,
    )
    .bind(requester_user_id)
    .bind(addressee_user_id)
    .fetch_one(pool)
    .await
}

pub async fn update_contact_status(
    pool: &PgPool,
    contact_id: i64,
    status: ContactStatus,
) -> Result<ContactRow, sqlx::Error> {
    sqlx::query_as::<_, ContactRow>(
        r#"
        update contacts
        set status = $2
        where id = $1
        returning
            id,
            requester_user_id,
            addressee_user_id,
            status,
            created_at,
            updated_at
        "#,
    )
    .bind(contact_id)
    .bind(status)
    .fetch_one(pool)
    .await
}

pub async fn find_contact_by_id(
    pool: &PgPool,
    contact_id: i64,
) -> Result<Option<ContactRow>, sqlx::Error> {
    sqlx::query_as::<_, ContactRow>(
        r#"
        select
            id,
            requester_user_id,
            addressee_user_id,
            status,
            created_at,
            updated_at
        from contacts
        where id = $1
        "#,
    )
    .bind(contact_id)
    .fetch_optional(pool)
    .await
}

pub async fn list_user_contacts(
    pool: &PgPool,
    user_id: i64,
) -> Result<Vec<ContactRow>, sqlx::Error> {
    sqlx::query_as::<_, ContactRow>(
        r#"
        select
            id,
            requester_user_id,
            addressee_user_id,
            status,
            created_at,
            updated_at
        from contacts
        where requester_user_id = $1
           or addressee_user_id = $1
        order by updated_at desc, id desc
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct CareerInterestRow {
    pub opportunity_id: i64,
    pub opportunity_title: String,
    pub opportunity_type: OpportunityType,
    pub employer_name: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub async fn list_applied_career_interests(
    pool: &PgPool,
    applicant_profile_id: i64,
) -> Result<Vec<CareerInterestRow>, sqlx::Error> {
    sqlx::query_as::<_, CareerInterestRow>(
        r#"
        select
            o.id as opportunity_id,
            o.title as opportunity_title,
            o.opportunity_type,
            ep.company_name as employer_name,
            a.created_at
        from applications a
        join opportunities o on o.id = a.opportunity_id
        left join employer_profiles ep on ep.id = o.employer_profile_id
        where a.applicant_profile_id = $1
        order by a.created_at desc, a.id desc
        "#,
    )
    .bind(applicant_profile_id)
    .fetch_all(pool)
    .await
}

pub async fn list_favorited_career_interests(
    pool: &PgPool,
    user_id: i64,
) -> Result<Vec<CareerInterestRow>, sqlx::Error> {
    sqlx::query_as::<_, CareerInterestRow>(
        r#"
        select
            o.id as opportunity_id,
            o.title as opportunity_title,
            o.opportunity_type,
            ep.company_name as employer_name,
            fo.created_at
        from favorite_opportunities fo
        join opportunities o on o.id = fo.opportunity_id
        left join employer_profiles ep on ep.id = o.employer_profile_id
        where fo.user_id = $1
        order by fo.created_at desc, o.id desc
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}