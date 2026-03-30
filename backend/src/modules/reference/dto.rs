use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CityReferenceResponse {
    pub id: i64,
    pub city_name: String,
    pub country: Option<String>,
    pub region: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AddressReferenceResponse {
    pub id: i64,
    pub city_id: i64,
    pub city_name: String,
    pub full_address: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AddressListQuery {
    pub city_id: Option<i64>,
}
