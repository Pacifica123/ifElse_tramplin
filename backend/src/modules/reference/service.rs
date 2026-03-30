use sqlx::PgPool;

use super::repo::{self, AddressReferenceRow, CityReferenceRow};

pub async fn list_cities(pool: &PgPool) -> Result<Vec<CityReferenceRow>, sqlx::Error> {
    repo::list_cities(pool).await
}

pub async fn list_addresses(
    pool: &PgPool,
    city_id: Option<i64>,
) -> Result<Vec<AddressReferenceRow>, sqlx::Error> {
    repo::list_addresses(pool, city_id).await
}
