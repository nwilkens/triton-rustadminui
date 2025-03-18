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
        
        // Parse the response JSON
        let vms_data: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse VMAPI response: {}", e)))?;
            
        // Convert the response data to our VM model
        let vms: Vec<crate::api::vms::Vm> = vms_data
            .into_iter()
            .filter_map(|vm_data| {
                let uuid = vm_data["uuid"].as_str()?;
                let alias = vm_data["alias"].as_str()?;
                let state = vm_data["state"].as_str()?;
                let brand = vm_data["brand"].as_str()?;
                let memory = vm_data["ram"].as_u64()?;
                let disk = vm_data["quota"].as_u64()?;
                let vcpus = vm_data["vcpus"].as_u64()? as u32;
                
                // Extract IPs from nics
                let mut ips = Vec::new();
                if let Some(nics) = vm_data["nics"].as_array() {
                    for nic in nics {
                        if let Some(ip) = nic["ip"].as_str() {
                            ips.push(ip.to_string());
                        }
                    }
                }
                
                let owner_uuid = vm_data["owner_uuid"].as_str()?.to_string();
                let image_uuid = vm_data["image_uuid"].as_str().unwrap_or("").to_string();
                let package_uuid = vm_data["billing_id"].as_str().unwrap_or("").to_string();
                let server_uuid = vm_data["server_uuid"].as_str().unwrap_or("").to_string();
                let created_at = vm_data["created_at"].as_str().unwrap_or("").to_string();
                
                let tags = vm_data["tags"].clone();
                let customer_metadata = vm_data["customer_metadata"].clone();
                let internal_metadata = vm_data["internal_metadata"].clone();
                
                Some(crate::api::vms::Vm {
                    uuid: uuid.to_string(),
                    alias: alias.to_string(),
                    state: state.to_string(),
                    brand: brand.to_string(),
                    memory,
                    disk,
                    vcpus,
                    ips,
                    owner_uuid,
                    image_uuid,
                    package_uuid,
                    server_uuid,
                    created_at,
                    tags,
                    customer_metadata,
                    internal_metadata,
                })
            })
            .collect();
            
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
            .ok_or_else(|| AppError::InternalServerError("State not found in VMAPI response".to_string()))?;
            
        let brand = vm_data["brand"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Brand not found in VMAPI response".to_string()))?;
            
        let memory = vm_data["ram"]
            .as_u64()
            .ok_or_else(|| AppError::InternalServerError("Memory not found in VMAPI response".to_string()))?;
            
        let disk = vm_data["quota"]
            .as_u64()
            .ok_or_else(|| AppError::InternalServerError("Disk not found in VMAPI response".to_string()))?;
            
        let vcpus = vm_data["vcpus"]
            .as_u64()
            .ok_or_else(|| AppError::InternalServerError("VCPUs not found in VMAPI response".to_string()))? as u32;
            
        // Extract IPs from nics
        let mut ips = Vec::new();
        if let Some(nics) = vm_data["nics"].as_array() {
            for nic in nics {
                if let Some(ip) = nic["ip"].as_str() {
                    ips.push(ip.to_string());
                }
            }
        }
        
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
            
        let created_at = vm_data["created_at"]
            .as_str()
            .unwrap_or("")
            .to_string();
            
        let tags = vm_data["tags"].clone();
        let customer_metadata = vm_data["customer_metadata"].clone();
        let internal_metadata = vm_data["internal_metadata"].clone();
        
        let vm = crate::api::vms::Vm {
            uuid: uuid.to_string(),
            alias: alias.to_string(),
            state: state.to_string(),
            brand: brand.to_string(),
            memory,
            disk,
            vcpus,
            ips,
            owner_uuid,
            image_uuid,
            package_uuid,
            server_uuid,
            created_at,
            tags,
            customer_metadata,
            internal_metadata,
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
        
        // Construct the URL for the VMAPI VM action endpoint
        let action_url = format!("{}/vms/{}", self.base_url, uuid);
        
        let payload = match action {
            "start" => serde_json::json!({ "action": "start" }),
            "stop" => serde_json::json!({ "action": "stop" }),
            "reboot" => serde_json::json!({ "action": "reboot" }),
            _ => return Err(AppError::BadRequest(format!("Unsupported action: {}", action))),
        };
        
        // Make the request to VMAPI
        let response = self.client
            .post(&action_url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to perform VM action with VMAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("VM with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to perform VM action with VMAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON to get the job UUID
        let job_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse VMAPI response: {}", e)))?;
            
        let job_uuid = job_data["job_uuid"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Job UUID not found in VMAPI response".to_string()))?;
            
        info!("VM action job started: {} for VM: {}", job_uuid, uuid);
        
        Ok(job_uuid.to_string())
    }
}