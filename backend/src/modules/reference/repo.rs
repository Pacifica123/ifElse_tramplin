use sqlx::{FromRow, PgPool};

#[derive(Debug, Clone, FromRow)]
pub struct CityReferenceRow {
    pub id: i64,
    pub city_name: String,
    pub country: Option<String>,
    pub region: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

#[derive(Debug, Clone, FromRow)]
pub struct AddressReferenceRow {
    pub id: i64,
    pub city_id: i64,
    pub city_name: String,
    pub full_address: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

pub async fn list_cities(pool: &PgPool) -> Result<Vec<CityReferenceRow>, sqlx::Error> {
    sqlx::query_as::<_, CityReferenceRow>(
        r#"
        select
            id,
            city_name,
            country,
            region,
            latitude,
            longitude
        from cities
        order by lower(city_name) asc, id asc
        "#,
    )
    .fetch_all(pool)
    .await
}

pub async fn list_addresses(
    pool: &PgPool,
    city_id: Option<i64>,
) -> Result<Vec<AddressReferenceRow>, sqlx::Error> {
    match city_id {
        Some(city_id) => {
            sqlx::query_as::<_, AddressReferenceRow>(
                r#"
                select
                    a.id,
                    a.city_id,
                    c.city_name,
                    a.full_address,
                    a.latitude,
                    a.longitude
                from addresses a
                join cities c on c.id = a.city_id
                where a.city_id = $1
                order by lower(a.full_address) asc, a.id asc
                "#,
            )
            .bind(city_id)
            .fetch_all(pool)
            .await
        }
        None => {
            sqlx::query_as::<_, AddressReferenceRow>(
                r#"
                select
                    a.id,
                    a.city_id,
                    c.city_name,
                    a.full_address,
                    a.latitude,
                    a.longitude
                from addresses a
                join cities c on c.id = a.city_id
                order by lower(c.city_name) asc, lower(a.full_address) asc, a.id asc
                "#,
            )
            .fetch_all(pool)
            .await
        }
    }
}
