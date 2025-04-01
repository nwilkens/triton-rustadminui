use actix_web::{get, web::{Data}, HttpResponse};
use serde::{Deserialize, Serialize};
use tracing::info;
use futures::try_join;

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub vms_count: usize,
    pub users_count: usize,
    pub servers_count: usize,
    pub servers_reserved: usize,
    pub servers_total: usize,
    pub memory_provisionable_gb: f64,
    pub memory_total_gb: f64,
    pub utilization_percent: f64,
}

#[get("")]
pub async fn get_dashboard_stats(
    _user: AuthenticatedUser,
    config: Data<Config>,
) -> Result<HttpResponse, AppError> {
    info!("Fetching dashboard statistics");
    
    // Create service clients
    let vmapi_service = crate::services::VmapiService::new(config.vmapi_url.clone());
    let ufds_service = crate::services::UfdsService::new(config.ufds_url.clone());
    let cnapi_service = crate::services::CnapiService::new(config.cnapi_url.clone());
    
    // Get data from services in parallel
    let vms_result = vmapi_service.list_vms();
    let users_result = ufds_service.list_users();
    let servers_result = cnapi_service.list_servers();
    
    let (vms, users, servers) = try_join!(vms_result, users_result, servers_result)?;
    
    // Calculate statistics
    let vms_count = vms.len();
    let users_count = users.len();
    let servers_count = servers.len();
    
    // Calculate reserved servers (default to 0 for demo)
    let servers_reserved = 0;
    
    // Calculate memory statistics
    let bytes_to_gb = |bytes: u64| (bytes as f64) / (1024.0 * 1024.0 * 1024.0);
    
    let memory_total_bytes: u64 = servers.iter()
        .filter(|s| s.status == "running")
        .map(|s| s.memory_total_bytes)
        .sum();
    
    let memory_available_bytes: u64 = servers.iter()
        .filter(|s| s.status == "running")
        .map(|s| s.memory_available_bytes)
        .sum();
    
    let memory_total_gb = bytes_to_gb(memory_total_bytes);
    let memory_provisionable_gb = bytes_to_gb(memory_available_bytes);
    
    // Calculate utilization
    let utilization_percent = if memory_total_bytes > 0 {
        100.0 - ((memory_available_bytes as f64) / (memory_total_bytes as f64) * 100.0)
    } else {
        0.0
    };
    
    // Create response
    let stats = DashboardStats {
        vms_count,
        users_count,
        servers_count,
        servers_reserved,
        servers_total: servers_count,
        memory_provisionable_gb,
        memory_total_gb,
        utilization_percent,
    };
    
    Ok(HttpResponse::Ok().json(stats))
}