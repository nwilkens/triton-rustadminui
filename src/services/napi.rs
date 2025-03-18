use serde::{Deserialize, Serialize};
use uuid::Uuid;
use anyhow::Result;
use tracing::info;

use crate::error::AppError;

pub struct NapiService {
    client: reqwest::Client,
    base_url: String,
}

impl NapiService {
    pub fn new(base_url: String) -> Self {
        info!("Initializing NAPI service with URL: {}", base_url);
        Self {
            client: reqwest::Client::new(),
            base_url,
        }
    }
    
    pub async fn list_networks(&self) -> Result<Vec<crate::api::networks::Network>, AppError> {
        info!("Fetching network list from NAPI");
        
        // Construct the URL for the NAPI networks endpoint
        let networks_url = format!("{}/networks", self.base_url);
        
        // Make the request to NAPI
        let response = self.client
            .get(&networks_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch networks from NAPI: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch networks from NAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let networks_data: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse NAPI response: {}", e)))?;
            
        // Convert the response data to our Network model
        let networks: Vec<crate::api::networks::Network> = networks_data
            .into_iter()
            .filter_map(|network_data| {
                let uuid = network_data["uuid"].as_str()?;
                let name = network_data["name"].as_str()?;
                let subnet = network_data["subnet"].as_str()?;
                let netmask = network_data["netmask"].as_str()?;
                let gateway = network_data["gateway"].as_str()?;
                let provision_start_ip = network_data["provision_start_ip"].as_str()?;
                let provision_end_ip = network_data["provision_end_ip"].as_str()?;
                let vlan_id = network_data["vlan_id"].as_u64()? as u16;
                let fabric = network_data["fabric"].as_bool().unwrap_or(false);
                
                let owner_uuid = network_data["owner_uuid"].as_str().map(|s| s.to_string());
                let description = network_data["description"].as_str().map(|s| s.to_string());
                
                let created_at = network_data["created_at"].as_str().unwrap_or("").to_string();
                let updated_at = network_data["updated_at"].as_str().unwrap_or("").to_string();
                
                Some(crate::api::networks::Network {
                    uuid: uuid.to_string(),
                    name: name.to_string(),
                    subnet: subnet.to_string(),
                    netmask: netmask.to_string(),
                    gateway: gateway.to_string(),
                    provision_start_ip: provision_start_ip.to_string(),
                    provision_end_ip: provision_end_ip.to_string(),
                    vlan_id,
                    fabric,
                    owner_uuid,
                    description,
                    created_at,
                    updated_at,
                })
            })
            .collect();
            
        info!("Successfully fetched {} networks from NAPI", networks.len());
        Ok(networks)
    }
    
    pub async fn get_network(&self, uuid: &str) -> Result<crate::api::networks::Network, AppError> {
        info!("Fetching network with UUID: {}", uuid);
        
        // Construct the URL for the NAPI network endpoint
        let network_url = format!("{}/networks/{}", self.base_url, uuid);
        
        // Make the request to NAPI
        let response = self.client
            .get(&network_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch network from NAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Network with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch network from NAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let network_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse NAPI response: {}", e)))?;
            
        // Extract the required fields from the response
        let name = network_data["name"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Name not found in NAPI response".to_string()))?;
            
        let subnet = network_data["subnet"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Subnet not found in NAPI response".to_string()))?;
            
        let netmask = network_data["netmask"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Netmask not found in NAPI response".to_string()))?;
            
        let gateway = network_data["gateway"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Gateway not found in NAPI response".to_string()))?;
            
        let provision_start_ip = network_data["provision_start_ip"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Provision start IP not found in NAPI response".to_string()))?;
            
        let provision_end_ip = network_data["provision_end_ip"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Provision end IP not found in NAPI response".to_string()))?;
            
        let vlan_id = network_data["vlan_id"]
            .as_u64()
            .ok_or_else(|| AppError::InternalServerError("VLAN ID not found in NAPI response".to_string()))? as u16;
            
        let fabric = network_data["fabric"].as_bool().unwrap_or(false);
        
        let owner_uuid = network_data["owner_uuid"].as_str().map(|s| s.to_string());
        let description = network_data["description"].as_str().map(|s| s.to_string());
        
        let created_at = network_data["created_at"].as_str().unwrap_or("").to_string();
        let updated_at = network_data["updated_at"].as_str().unwrap_or("").to_string();
        
        let network = crate::api::networks::Network {
            uuid: uuid.to_string(),
            name: name.to_string(),
            subnet: subnet.to_string(),
            netmask: netmask.to_string(),
            gateway: gateway.to_string(),
            provision_start_ip: provision_start_ip.to_string(),
            provision_end_ip: provision_end_ip.to_string(),
            vlan_id,
            fabric,
            owner_uuid,
            description,
            created_at,
            updated_at,
        };
        
        info!("Successfully fetched network {} ({})", uuid, name);
        Ok(network)
    }
    
    pub async fn create_network(
        &self, 
        network: crate::api::networks::CreateNetworkRequest
    ) -> Result<crate::api::networks::Network, AppError> {
        info!("Creating new network with name: {}", network.name);
        
        // Construct the URL for the NAPI networks endpoint
        let networks_url = format!("{}/networks", self.base_url);
        
        // Make the request to NAPI
        let response = self.client
            .post(&networks_url)
            .json(&network)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to create network with NAPI: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to create network with NAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let network_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse NAPI response: {}", e)))?;
            
        // Extract the UUID from the response
        let uuid = network_data["uuid"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("UUID not found in NAPI response".to_string()))?;
            
        info!("Successfully created network {} ({})", uuid, network.name);
        
        // Get the full network details
        self.get_network(uuid).await
    }
    
    pub async fn update_network(
        &self, 
        uuid: &str, 
        network: crate::api::networks::UpdateNetworkRequest
    ) -> Result<crate::api::networks::Network, AppError> {
        info!("Updating network with UUID: {}", uuid);
        
        // Construct the URL for the NAPI network endpoint
        let network_url = format!("{}/networks/{}", self.base_url, uuid);
        
        // Make the request to NAPI
        let response = self.client
            .put(&network_url)
            .json(&network)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to update network with NAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Network with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to update network with NAPI: {} - {}", status, error_text)));
        }
        
        info!("Successfully updated network {}", uuid);
        
        // Get the updated network
        self.get_network(uuid).await
    }
    
    pub async fn delete_network(&self, uuid: &str) -> Result<(), AppError> {
        info!("Deleting network with UUID: {}", uuid);
        
        // Construct the URL for the NAPI network endpoint
        let network_url = format!("{}/networks/{}", self.base_url, uuid);
        
        // Make the request to NAPI
        let response = self.client
            .delete(&network_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to delete network with NAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Network with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to delete network with NAPI: {} - {}", status, error_text)));
        }
        
        info!("Successfully deleted network {}", uuid);
        Ok(())
    }
}