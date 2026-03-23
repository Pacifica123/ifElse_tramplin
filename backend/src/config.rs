use std::net::{IpAddr, SocketAddr};

use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Settings {
    pub app: AppSettings,
    pub database: DatabaseSettings,
    pub http: HttpSettings,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AppSettings {
    pub name: String,
    pub env: String,
    pub host: IpAddr,
    pub port: u16,
    pub log_format: LogFormat,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseSettings {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connect_timeout_secs: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct HttpSettings {
    pub body_limit_mb: usize,
    pub cors_allowed_origins: Vec<String>,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogFormat {
    Pretty,
    Json,
}

impl Settings {
    pub fn load() -> Result<Self, ConfigError> {
        dotenvy::dotenv().ok();

        let builder = Config::builder()
            .add_source(File::with_name("config/default").required(false))
            .add_source(
                Environment::default()
                    .separator("__")
                    .list_separator(",")
                    .with_list_parse_key("http.cors_allowed_origins")
                    .try_parsing(true),
            );

        builder.build()?.try_deserialize()
    }

    pub fn socket_addr(&self) -> SocketAddr {
        SocketAddr::new(self.app.host, self.app.port)
    }
}