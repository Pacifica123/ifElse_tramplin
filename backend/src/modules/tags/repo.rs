use sqlx::{FromRow, PgPool};

use crate::models::TagType;

#[derive(Debug, Clone, FromRow)]
pub struct TagRow {
    pub id: i64,
    pub name: String,
    pub tag_type: TagType,
    pub is_system: bool,
    pub is_active: bool,
}

pub async fn list_active_tags(pool: &PgPool) -> Result<Vec<TagRow>, sqlx::Error> {
    sqlx::query_as::<_, TagRow>(
        r#"
        select
            id,
            name,
            tag_type,
            is_system,
            is_active
        from tags
        where is_active = true
        order by
            case tag_type
                when 'technology' then 1
                when 'level' then 2
                when 'employment' then 3
                when 'category' then 4
                else 99
            end,
            lower(name)
        "#,
    )
    .fetch_all(pool)
    .await
}
