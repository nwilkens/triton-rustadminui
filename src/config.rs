use serde::Deserialize;
use std::env;
use anyhow::Result;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration: i64,
    pub log_level: String,
    pub triton_datacenter: String,
    
    // URLs for Triton services
    pub vmapi_url: String,
    pub cnapi_url: String,
    pub napi_url: String,
    pub imgapi_url: String,
    pub amon_url: String,
    pub ufds_url: String,
    pub sapi_url: String,
    pub fwapi_url: String,
    pub papi_url: String,
    pub mahi_url: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()?,
            database_url: env::var("DATABASE_URL")?,
            jwt_secret: env::var("JWT_SECRET")?,
            jwt_expiration: env::var("JWT_EXPIRATION")
                .unwrap_or_else(|_| "60".to_string())
                .parse()?,
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            triton_datacenter: env::var("TRITON_DATACENTER")?,
            
            // Triton service URLs - in production these would be provided by service discovery
            vmapi_url: env::var("VMAPI_URL")?,
            cnapi_url: env::var("CNAPI_URL")?,
            napi_url: env::var("NAPI_URL")?,
            imgapi_url: env::var("IMGAPI_URL")?,
            amon_url: env::var("AMON_URL")?,
            ufds_url: env::var("UFDS_URL")?,
            sapi_url: env::var("SAPI_URL")?,
            fwapi_url: env::var("FWAPI_URL")?,
            papi_url: env::var("PAPI_URL")?,
            mahi_url: env::var("MAHI_URL")?,
        })
    }
}