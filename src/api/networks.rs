use actix_web::{get, post, put, delete, web::{self, Data, Json, Path, Query}, HttpResponse};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkListParams {
    pub name: Option<String>,
    pub fabric: Option<bool>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Network {
    pub uuid: String,
    pub name: String,
    pub subnet: String,
    pub netmask: String,
    pub gateway: String,
    pub provision_start_ip: String,
    pub provision_end_ip: String,
    pub vlan_id: u16,
    pub fabric: bool,
    pub owner_uuid: Option<String>,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[get("")]
pub async fn list_networks(
    _user: AuthenticatedUser,
    config: Data<Config>,
    query: Query<NetworkListParams>,
) -> Result<HttpResponse, AppError> {
    // Create NAPI service client
    let napi_service = crate::services::NapiService::new(config.napi_url.clone());
    
    // Get networks from NAPI
    let networks = napi_service.list_networks().await?;
    
    // If there are filtering parameters, apply them
    let filtered_networks = if query.name.is_some() || query.fabric.is_some() {
        networks.into_iter().filter(|network| {
            let name_match = match &query.name {
                Some(name) => network.name.contains(name),
                None => true,
            };
            
            let fabric_match = match query.fabric {
                Some(fabric) => network.fabric == fabric,
                None => true,
            };
            
            name_match && fabric_match
        }).collect()
    } else {
        networks
    };
    
    // Apply pagination if specified
    let paginated_networks = match (query.offset, query.limit) {
        (Some(offset), Some(limit)) => {
            let offset = offset as usize;
            let limit = limit as usize;
            filtered_networks.into_iter().skip(offset).take(limit).collect()
        },
        (Some(offset), None) => {
            let offset = offset as usize;
            filtered_networks.into_iter().skip(offset).collect()
        },
        (None, Some(limit)) => {
            let limit = limit as usize;
            filtered_networks.into_iter().take(limit).collect()
        },
        (None, None) => filtered_networks,
    };
    
    Ok(HttpResponse::Ok().json(paginated_networks))
}

#[get("/{uuid}")]
pub async fn get_network(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // Create NAPI service client
    let napi_service = crate::services::NapiService::new(config.napi_url.clone());
    
    // Get network from NAPI
    let network = napi_service.get_network(&uuid).await?;
    
    Ok(HttpResponse::Ok().json(network))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNetworkRequest {
    pub name: String,
    pub subnet: String,
    pub netmask: String,
    pub gateway: String,
    pub provision_start_ip: String,
    pub provision_end_ip: String,
    pub vlan_id: u16,
    pub owner_uuid: Option<String>,
    pub description: Option<String>,
}

#[post("")]
pub async fn create_network(
    _user: AuthenticatedUser,
    config: Data<Config>,
    network_req: Json<CreateNetworkRequest>,
) -> Result<HttpResponse, AppError> {
    // In a real implementation, this would call the NAPI client to create a network
    // For now, we'll just return a placeholder
    
    let network = Network {
        uuid: Uuid::new_v4().to_string(),
        name: network_req.name.clone(),
        subnet: network_req.subnet.clone(),
        netmask: network_req.netmask.clone(),
        gateway: network_req.gateway.clone(),
        provision_start_ip: network_req.provision_start_ip.clone(),
        provision_end_ip: network_req.provision_end_ip.clone(),
        vlan_id: network_req.vlan_id,
        fabric: false,
        owner_uuid: network_req.owner_uuid.clone(),
        description: network_req.description.clone(),
        created_at: "2023-01-01T00:00:00Z".to_string(),
        updated_at: "2023-01-01T00:00:00Z".to_string(),
    };
    
    Ok(HttpResponse::Created().json(network))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNetworkRequest {
    pub name: Option<String>,
    pub gateway: Option<String>,
    pub provision_start_ip: Option<String>,
    pub provision_end_ip: Option<String>,
    pub description: Option<String>,
}

#[put("/{uuid}")]
pub async fn update_network(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
    network_req: Json<UpdateNetworkRequest>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // In a real implementation, this would call the NAPI client to update a network
    // For now, we'll just return a placeholder
    
    let network = Network {
        uuid,
        name: network_req.name.clone().unwrap_or_else(|| "external".to_string()),
        subnet: "192.168.1.0".to_string(),
        netmask: "255.255.255.0".to_string(),
        gateway: network_req.gateway.clone().unwrap_or_else(|| "192.168.1.1".to_string()),
        provision_start_ip: network_req.provision_start_ip.clone().unwrap_or_else(|| "192.168.1.10".to_string()),
        provision_end_ip: network_req.provision_end_ip.clone().unwrap_or_else(|| "192.168.1.250".to_string()),
        vlan_id: 1,
        fabric: false,
        owner_uuid: None,
        description: network_req.description.clone(),
        created_at: "2023-01-01T00:00:00Z".to_string(),
        updated_at: "2023-01-01T00:00:00Z".to_string(),
    };
    
    Ok(HttpResponse::Ok().json(network))
}

#[delete("/{uuid}")]
pub async fn delete_network(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // In a real implementation, this would call the NAPI client to delete a network
    // For now, we'll just return a placeholder
    
    Ok(HttpResponse::NoContent().finish())
}