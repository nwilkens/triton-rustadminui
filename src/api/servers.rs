use actix_web::{get, post, patch, web::{self, Data, Json, Path, Query}, HttpResponse};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerListParams {
    pub hostname: Option<String>,
    pub status: Option<String>,
    pub setup: Option<bool>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Server {
    pub uuid: String,
    pub hostname: String,
    pub status: String,
    pub setup: bool,
    pub datacenter: String,
    pub memory_total_bytes: u64,
    pub memory_available_bytes: u64,
    pub disk_total_bytes: u64,
    pub disk_available_bytes: u64,
    pub platform_version: String,
    pub sysinfo: serde_json::Value,
    pub created_at: String,
    pub updated_at: String,
}

#[get("")]
pub async fn list_servers(
    _user: AuthenticatedUser,
    config: Data<Config>,
    query: Query<ServerListParams>,
) -> Result<HttpResponse, AppError> {
    // Create CNAPI service client
    let cnapi_service = crate::services::CnapiService::new(config.cnapi_url.clone());
    
    // Get servers from CNAPI
    let servers = cnapi_service.list_servers().await?;
    
    // If there are filtering parameters, apply them
    let filtered_servers = if query.hostname.is_some() || query.status.is_some() || query.setup.is_some() {
        servers.into_iter().filter(|server| {
            let hostname_match = match &query.hostname {
                Some(hostname) => server.hostname.contains(hostname),
                None => true,
            };
            
            let status_match = match &query.status {
                Some(status) => server.status == *status,
                None => true,
            };
            
            let setup_match = match query.setup {
                Some(setup) => server.setup == setup,
                None => true,
            };
            
            hostname_match && status_match && setup_match
        }).collect()
    } else {
        servers
    };
    
    // Apply pagination if specified
    let paginated_servers = match (query.offset, query.limit) {
        (Some(offset), Some(limit)) => {
            let offset = offset as usize;
            let limit = limit as usize;
            filtered_servers.into_iter().skip(offset).take(limit).collect()
        },
        (Some(offset), None) => {
            let offset = offset as usize;
            filtered_servers.into_iter().skip(offset).collect()
        },
        (None, Some(limit)) => {
            let limit = limit as usize;
            filtered_servers.into_iter().take(limit).collect()
        },
        (None, None) => filtered_servers,
    };
    
    Ok(HttpResponse::Ok().json(paginated_servers))
}

#[get("/{uuid}")]
pub async fn get_server(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // Create CNAPI service client
    let cnapi_service = crate::services::CnapiService::new(config.cnapi_url.clone());
    
    // Get server from CNAPI
    let server = cnapi_service.get_server(&uuid).await?;
    
    Ok(HttpResponse::Ok().json(server))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateServerRequest {
    pub hostname: Option<String>,
    pub datacenter: Option<String>,
    pub rack_identifier: Option<String>,
    pub reserved: Option<bool>,
}

#[patch("/{uuid}")]
pub async fn update_server(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
    server_req: Json<UpdateServerRequest>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // In a real implementation, this would call the CNAPI client to update a server
    // For now, we'll just return a placeholder
    
    let server = Server {
        uuid,
        hostname: server_req.hostname.clone().unwrap_or_else(|| "compute-01".to_string()),
        status: "running".to_string(),
        setup: true,
        datacenter: server_req.datacenter.clone().unwrap_or_else(|| "us-east-1".to_string()),
        memory_total_bytes: 128 * 1024 * 1024 * 1024, // 128 GB
        memory_available_bytes: 64 * 1024 * 1024 * 1024, // 64 GB
        disk_total_bytes: 2 * 1024 * 1024 * 1024 * 1024, // 2 TB
        disk_available_bytes: 1 * 1024 * 1024 * 1024 * 1024, // 1 TB
        platform_version: "20230101T000000Z".to_string(),
        sysinfo: serde_json::json!({"CPU Physical Cores": 16}),
        created_at: "2023-01-01T00:00:00Z".to_string(),
        updated_at: "2023-01-01T00:00:00Z".to_string(),
    };
    
    Ok(HttpResponse::Ok().json(server))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerActionRequest {
    pub action: String,
    pub params: Option<serde_json::Value>,
}

#[post("/{uuid}")]
pub async fn server_action(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
    action_req: Json<ServerActionRequest>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // In a real implementation, this would call the CNAPI client to perform an action on a server
    // For now, we'll just return a placeholder
    
    match action_req.action.as_str() {
        "setup" => {
            // Setup server
            Ok(HttpResponse::Accepted().json(serde_json::json!({
                "job_uuid": Uuid::new_v4().to_string()
            })))
        },
        "reboot" => {
            // Reboot server
            Ok(HttpResponse::Accepted().json(serde_json::json!({
                "job_uuid": Uuid::new_v4().to_string()
            })))
        },
        "factory-reset" => {
            // Factory reset server
            Ok(HttpResponse::Accepted().json(serde_json::json!({
                "job_uuid": Uuid::new_v4().to_string()
            })))
        },
        "update-nics" => {
            // Update NICs
            Ok(HttpResponse::Accepted().json(serde_json::json!({
                "job_uuid": Uuid::new_v4().to_string()
            })))
        },
        _ => {
            Err(AppError::BadRequest(format!("Unsupported action: {}", action_req.action)))
        },
    }
}