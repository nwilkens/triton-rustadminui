use actix_web::{get, web::{Data, Query}, HttpResponse};
use serde::{Deserialize, Serialize};

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformListParams {
    pub version: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Platform {
    pub version: String,
    pub latest: bool,
    pub boot_params: serde_json::Value,
    pub kernel_args: serde_json::Value,
    pub available: bool,
}

#[get("")]
pub async fn list_platforms(
    _user: AuthenticatedUser,
    config: Data<Config>,
    query: Query<PlatformListParams>,
) -> Result<HttpResponse, AppError> {
    // In a real implementation, this would call the CNAPI client to list platforms
    // For now, we'll just return a placeholder
    
    let platforms = vec![
        Platform {
            version: "20230101T000000Z".to_string(),
            latest: true,
            boot_params: serde_json::json!({}),
            kernel_args: serde_json::json!({}),
            available: true,
        },
        Platform {
            version: "20221201T000000Z".to_string(),
            latest: false,
            boot_params: serde_json::json!({}),
            kernel_args: serde_json::json!({}),
            available: true,
        },
    ];
    
    Ok(HttpResponse::Ok().json(platforms))
}