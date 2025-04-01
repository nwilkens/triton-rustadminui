use reqwest;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use anyhow::Result;
use tracing::info;

use crate::error::AppError;

pub struct VmapiService {
    client: reqwest::Client,
    base_url: String,
}

impl VmapiService {
    pub fn new(base_url: String) -> Self {
        info!("Initializing VMAPI service with URL: {}", base_url);
        Self {
            client: reqwest::Client::new(),
            base_url,
        }
    }
    
    pub async fn list_vms(&self) -> Result<Vec<crate::api::vms::Vm>, AppError> {
        info!("Fetching VM list from VMAPI");
        
        // Construct the URL for the VMAPI VMs endpoint
        let vms_url = format!("{}/vms", self.base_url);
        
        // Make the request to VMAPI
        let response = self.client
            .get(&vms_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch VMs from VMAPI: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch VMs from VMAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON directly into our VM model
        let vms_data: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| {
                info!("Error parsing VMAPI response: {}", e);
                AppError::InternalServerError(format!("Failed to parse VMAPI response: {}", e))
            })?;
        
        // Convert to our VM model
        let mut vms = Vec::new();
        
        for vm_data in vms_data {
            // Extract the required fields
            let uuid = match vm_data["uuid"].as_str() {
                Some(uuid) => uuid,
                None => continue, // Skip if UUID is missing
            };
            
            let alias = match vm_data["alias"].as_str() {
                Some(alias) => alias,
                None => continue, // Skip if alias is missing
            };
            
            let state = match vm_data["state"].as_str() {
                Some(state) => state,
                None => "unknown",
            };
            
            let brand = match vm_data["brand"].as_str() {
                Some(brand) => brand,
                None => "unknown",
            };
            
            let memory = vm_data["ram"].as_u64().unwrap_or(0);
            let disk = vm_data["quota"].as_u64().unwrap_or(0);
            let vcpus = vm_data["vcpus"].as_u64().unwrap_or(1) as u32;
            
            // Extract IPs from nics but also pass the whole nics array through
            let mut ips = Vec::new();
            let nics = vm_data["nics"].clone(); // Clone the entire nics array to pass through
            
            let owner_uuid = match vm_data["owner_uuid"].as_str() {
                Some(owner_uuid) => owner_uuid,
                None => continue, // Skip if owner_uuid is missing
            };
            
            let image_uuid = vm_data["image_uuid"].as_str().unwrap_or("").to_string();
            let package_uuid = vm_data["billing_id"].as_str().unwrap_or("").to_string();
            let server_uuid = vm_data["server_uuid"].as_str().unwrap_or("").to_string();
            
            // Handle different timestamp names: create_timestamp or created_at
            let created_at = match vm_data["create_timestamp"].as_str() {
                Some(ts) => ts.to_string(),
                None => vm_data["created_at"].as_str().unwrap_or("").to_string(),
            };
            
            let tags = vm_data["tags"].clone();
            let customer_metadata = vm_data["customer_metadata"].clone();
            let internal_metadata = vm_data["internal_metadata"].clone();
            
            vms.push(crate::api::vms::Vm {
                uuid: uuid.to_string(),
                alias: alias.to_string(),
                state: state.to_string(),
                brand: brand.to_string(),
                memory,
                quota: disk, // Use disk value for quota
                disk,
                vcpus,
                ips,
                owner_uuid: owner_uuid.to_string(),
                image_uuid,
                package_uuid,
                server_uuid,
                created_at,
                tags,
                customer_metadata,
                internal_metadata,
                nics: Some(nics.as_array().unwrap_or(&vec![]).to_vec()),
            });
        }
            
        info!("Successfully fetched {} VMs from VMAPI", vms.len());
        Ok(vms)
    }
    
    pub async fn get_vm(&self, uuid: &str) -> Result<crate::api::vms::Vm, AppError> {
        info!("Fetching VM with UUID: {}", uuid);
        
        // Construct the URL for the VMAPI VM endpoint
        let vm_url = format!("{}/vms/{}", self.base_url, uuid);
        
        // Make the request to VMAPI
        let response = self.client
            .get(&vm_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch VM from VMAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("VM with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch VM from VMAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let vm_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse VMAPI response: {}", e)))?;
            
        // Extract the required fields from the response
        let alias = vm_data["alias"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Alias not found in VMAPI response".to_string()))?;
            
        let state = vm_data["state"]
            .as_str()
            .unwrap_or("unknown");
            
        let brand = vm_data["brand"]
            .as_str()
            .unwrap_or("unknown");
            
        let memory = vm_data["ram"]
            .as_u64()
            .unwrap_or(0);
            
        let disk = vm_data["quota"]
            .as_u64()
            .unwrap_or(0);
            
        let vcpus = vm_data["vcpus"]
            .as_u64()
            .unwrap_or(1) as u32;
            
        // Extract the nics array
        let nics = vm_data["nics"].clone();
        
        let owner_uuid = vm_data["owner_uuid"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Owner UUID not found in VMAPI response".to_string()))?
            .to_string();
            
        let image_uuid = vm_data["image_uuid"]
            .as_str()
            .unwrap_or("")
            .to_string();
            
        let package_uuid = vm_data["billing_id"]
            .as_str()
            .unwrap_or("")
            .to_string();
            
        let server_uuid = vm_data["server_uuid"]
            .as_str()
            .unwrap_or("")
            .to_string();
            
        // Handle different timestamp names
        let created_at = match vm_data["create_timestamp"].as_str() {
            Some(ts) => ts.to_string(),
            None => vm_data["created_at"].as_str().unwrap_or("").to_string(),
        };
            
        let tags = vm_data["tags"].clone();
        let customer_metadata = vm_data["customer_metadata"].clone();
        let internal_metadata = vm_data["internal_metadata"].clone();
        
        let vm = crate::api::vms::Vm {
            uuid: uuid.to_string(),
            alias: alias.to_string(),
            state: state.to_string(),
            brand: brand.to_string(),
            memory,
            quota: disk, // We'll use disk value for quota since we're already extracting it from quota field
            disk,
            vcpus,
            ips: vec![],
            owner_uuid,
            image_uuid,
            package_uuid,
            server_uuid,
            created_at,
            tags,
            customer_metadata,
            internal_metadata,
            nics: Some(nics.as_array().unwrap_or(&vec![]).to_vec()),
        };
        
        info!("Successfully fetched VM {} ({})", uuid, alias);
        Ok(vm)
    }
    
    pub async fn create_vm(&self, vm: crate::api::vms::CreateVmRequest) -> Result<crate::api::vms::Vm, AppError> {
        info!("Creating new VM with alias: {}", vm.alias);
        
        // Construct the URL for the VMAPI VMs endpoint
        let vms_url = format!("{}/vms", self.base_url);
        
        // Make the request to VMAPI
        let response = self.client
            .post(&vms_url)
            .json(&vm)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to create VM with VMAPI: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to create VM with VMAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON to get the job UUID
        let job_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse VMAPI response: {}", e)))?;
            
        let job_uuid = job_data["job_uuid"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Job UUID not found in VMAPI response".to_string()))?;
            
        let vm_uuid = job_data["vm_uuid"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("VM UUID not found in VMAPI response".to_string()))?;
            
        info!("VM creation job started: {} for VM: {}", job_uuid, vm_uuid);
        
        // Return a placeholder VM object with the UUID and status
        // In a real implementation, we might poll the job status or return a more complete VM object
        let new_vm = crate::api::vms::Vm {
            uuid: vm_uuid.to_string(),
            alias: vm.alias.clone(),
            state: "provisioning".to_string(),
            brand: vm.brand.clone(),
            memory: 0, // Will be set based on package
            quota: 0,  // Will be set based on package
            disk: 0,   // Will be set based on package
            vcpus: 0,  // Will be set based on package
            ips: vec![],
            owner_uuid: vm.owner_uuid.clone(),
            image_uuid: vm.image_uuid.clone(),
            package_uuid: vm.package_uuid.clone(),
            server_uuid: "".to_string(), // Will be assigned during provisioning
            created_at: chrono::Utc::now().to_rfc3339(),
            tags: vm.tags.clone().unwrap_or(serde_json::json!({})),
            customer_metadata: vm.customer_metadata.clone().unwrap_or(serde_json::json!({})),
            internal_metadata: serde_json::json!({}),
            nics: None,
        };
        
        Ok(new_vm)
    }
    
    pub async fn update_vm(&self, uuid: &str, vm: crate::api::vms::UpdateVmRequest) -> Result<crate::api::vms::Vm, AppError> {
        info!("Updating VM with UUID: {}", uuid);
        
        // Construct the URL for the VMAPI VM endpoint
        let vm_url = format!("{}/vms/{}", self.base_url, uuid);
        
        // Make the request to VMAPI
        let response = self.client
            .post(&vm_url)
            .json(&vm)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to update VM with VMAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("VM with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to update VM with VMAPI: {} - {}", status, error_text)));
        }
        
        // Get the updated VM
        self.get_vm(uuid).await
    }
    
    pub async fn delete_vm(&self, uuid: &str) -> Result<(), AppError> {
        info!("Deleting VM with UUID: {}", uuid);
        
        // Construct the URL for the VMAPI VM endpoint
        let vm_url = format!("{}/vms/{}", self.base_url, uuid);
        
        // Make the request to VMAPI
        let response = self.client
            .delete(&vm_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to delete VM with VMAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("VM with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to delete VM with VMAPI: {} - {}", status, error_text)));
        }
        
        info!("Successfully deleted VM {}", uuid);
        Ok(())
    }
    
    pub async fn vm_action(&self, uuid: &str, action: &str) -> Result<String, AppError> {
        info!("Performing action {} on VM with UUID: {}", action, uuid);
        
        // Construct the URL for the VMAPI VM endpoint
        let vm_url = format!("{}/vms/{}", self.base_url, uuid);
        
        // Create the action payload
        let action_payload = serde_json::json!({
            "action": action
        });
        
        // Make the request to VMAPI
        let response = self.client
            .post(&vm_url)
            .json(&action_payload)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to perform action on VM with VMAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("VM with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to perform action on VM with VMAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON to get the job UUID if applicable
        let response_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse VMAPI response: {}", e)))?;
            
        // Return job UUID if provided, otherwise success message
        let job_uuid = response_data["job_uuid"].as_str().unwrap_or("");
        if !job_uuid.is_empty() {
            info!("VM action job started: {} for VM: {}", job_uuid, uuid);
            Ok(format!("Action '{}' initiated with job ID: {}", action, job_uuid))
        } else {
            info!("VM action completed successfully: {} for VM: {}", action, uuid);
            Ok(format!("Action '{}' completed successfully", action))
        }
    }
}