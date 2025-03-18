use serde::{Deserialize, Serialize};
use uuid::Uuid;
use anyhow::Result;

use crate::error::AppError;

pub struct CnapiService {
    client: reqwest::Client,
    base_url: String,
}

impl CnapiService {
    pub fn new(base_url: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url,
        }
    }
    
    pub async fn list_servers(&self) -> Result<Vec<crate::api::servers::Server>, AppError> {
        // Make a real HTTP request to CNAPI
        let servers_url = format!("{}/servers", self.base_url);
        
        let response = self.client
            .get(&servers_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("CNAPI request failed: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("CNAPI returned error: {} - {}", status, error_text)));
        }
        
        // Parse the response as a vector of server objects
        let servers_data: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse CNAPI response: {}", e)))?;
            
        // Convert the JSON to our Server type
        let servers = servers_data.into_iter().map(|server_json| {
            let uuid = server_json["uuid"]
                .as_str()
                .unwrap_or("unknown")
                .to_string();
                
            let hostname = server_json["hostname"]
                .as_str()
                .unwrap_or("unknown")
                .to_string();
                
            let status = server_json["status"]
                .as_str()
                .unwrap_or("unknown")
                .to_string();
                
            let setup = server_json["setup"]
                .as_bool()
                .unwrap_or(false);
                
            let datacenter = server_json["datacenter"]
                .as_str()
                .unwrap_or("unknown")
                .to_string();
                
            let memory_total_bytes = server_json["memory_total_bytes"]
                .as_u64()
                .unwrap_or(0);
                
            let memory_available_bytes = server_json["memory_available_bytes"]
                .as_u64()
                .unwrap_or(0);
                
            let disk_total_bytes = server_json["disk_total_bytes"]
                .as_u64()
                .unwrap_or(0);
                
            let disk_available_bytes = server_json["disk_available_bytes"]
                .as_u64()
                .unwrap_or(0);
                
            let platform_version = server_json["platform_version"]
                .as_str()
                .unwrap_or("unknown")
                .to_string();
                
            let sysinfo = server_json["sysinfo"].clone();
                
            let created_at = server_json["created_at"]
                .as_str()
                .unwrap_or("unknown")
                .to_string();
                
            let updated_at = server_json["updated_at"]
                .as_str()
                .unwrap_or("unknown")
                .to_string();
                
            crate::api::servers::Server {
                uuid,
                hostname,
                status,
                setup,
                datacenter,
                memory_total_bytes,
                memory_available_bytes,
                disk_total_bytes,
                disk_available_bytes,
                platform_version,
                sysinfo,
                created_at,
                updated_at,
            }
        }).collect();
        
        Ok(servers)
    }
    
    pub async fn get_server(&self, uuid: &str) -> Result<crate::api::servers::Server, AppError> {
        // Make a real HTTP request to CNAPI to get a specific server
        let server_url = format!("{}/servers/{}", self.base_url, uuid);
        
        let response = self.client
            .get(&server_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("CNAPI request failed: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Server with UUID {} not found", uuid)));
        } else if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("CNAPI returned error: {} - {}", status, error_text)));
        }
        
        // Parse the response as a server object
        let server_json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse CNAPI response: {}", e)))?;
            
        // Convert the JSON to our Server type
        let uuid = server_json["uuid"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();
            
        let hostname = server_json["hostname"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();
            
        let status = server_json["status"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();
            
        let setup = server_json["setup"]
            .as_bool()
            .unwrap_or(false);
            
        let datacenter = server_json["datacenter"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();
            
        let memory_total_bytes = server_json["memory_total_bytes"]
            .as_u64()
            .unwrap_or(0);
            
        let memory_available_bytes = server_json["memory_available_bytes"]
            .as_u64()
            .unwrap_or(0);
            
        let disk_total_bytes = server_json["disk_total_bytes"]
            .as_u64()
            .unwrap_or(0);
            
        let disk_available_bytes = server_json["disk_available_bytes"]
            .as_u64()
            .unwrap_or(0);
            
        let platform_version = server_json["platform_version"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();
            
        let sysinfo = server_json["sysinfo"].clone();
            
        let created_at = server_json["created_at"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();
            
        let updated_at = server_json["updated_at"]
            .as_str()
            .unwrap_or("unknown")
            .to_string();
            
        Ok(crate::api::servers::Server {
            uuid,
            hostname,
            status,
            setup,
            datacenter,
            memory_total_bytes,
            memory_available_bytes,
            disk_total_bytes,
            disk_available_bytes,
            platform_version,
            sysinfo,
            created_at,
            updated_at,
        })
    }
    
    pub async fn update_server(
        &self, 
        uuid: &str, 
        server: crate::api::servers::UpdateServerRequest
    ) -> Result<crate::api::servers::Server, AppError> {
        // Implement server update functionality
        let server_url = format!("{}/servers/{}", self.base_url, uuid);
        
        // Build the payload for the update
        let mut payload = serde_json::Map::new();
        
        if let Some(hostname) = &server.hostname {
            payload.insert("hostname".to_string(), serde_json::Value::String(hostname.clone()));
        }
        
        if let Some(datacenter) = &server.datacenter {
            payload.insert("datacenter".to_string(), serde_json::Value::String(datacenter.clone()));
        }
        
        if let Some(rack_identifier) = &server.rack_identifier {
            payload.insert("rack_identifier".to_string(), serde_json::Value::String(rack_identifier.clone()));
        }
        
        if let Some(reserved) = server.reserved {
            payload.insert("reserved".to_string(), serde_json::Value::Bool(reserved));
        }
        
        // Make the request to CNAPI
        let response = self.client
            .post(&server_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to update server with CNAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Server with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to update server with CNAPI: {} - {}", status, error_text)));
        }
        
        // After a successful update, fetch the updated server
        self.get_server(uuid).await
    }
    
    pub async fn server_action(&self, uuid: &str, action: &str) -> Result<String, AppError> {
        // Implement server actions like reboot, setup, etc.
        let action_url = format!("{}/servers/{}", self.base_url, uuid);
        
        let payload = match action {
            "reboot" => serde_json::json!({ "action": "reboot" }),
            "setup" => serde_json::json!({ "action": "setup" }),
            "factory-reset" => serde_json::json!({ "action": "factory-reset" }),
            _ => return Err(AppError::BadRequest(format!("Unsupported action: {}", action))),
        };
        
        // Make the request to CNAPI
        let response = self.client
            .post(&action_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to perform server action with CNAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Server with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to perform server action with CNAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON to get the job UUID
        let job_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse CNAPI response: {}", e)))?;
            
        let job_uuid = job_data["job_uuid"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Job UUID not found in CNAPI response".to_string()))?;
            
        Ok(job_uuid.to_string())
    }
    
    pub async fn list_platforms(&self) -> Result<Vec<crate::api::platforms::Platform>, AppError> {
        // This is a placeholder for actual implementation
        Ok(vec![])
    }
}