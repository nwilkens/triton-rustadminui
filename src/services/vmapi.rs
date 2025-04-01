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
    
    pub async fn list_vms_by_server(&self, server_uuid: &str) -> Result<Vec<crate::api::vms::Vm>, AppError> {
        info!("Fetching VMs for server: {}", server_uuid);
        
        // Construct the URL for the VMAPI VMs endpoint with server_uuid filter
        let vms_url = format!("{}/vms?server_uuid={}", self.base_url, server_uuid);
        
        // Make the request to VMAPI
        let response = self.client
            .get(&vms_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch VMs for server from VMAPI: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch VMs for server from VMAPI: {} - {}", status, error_text)));
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
                server_uuid: server_uuid.to_string(), // Set to the provided server_uuid
                created_at,
                tags,
                customer_metadata,
                internal_metadata,
                nics: Some(nics.as_array().unwrap_or(&vec![]).to_vec()),
            });
        }
            
        info!("Successfully fetched {} VMs for server {}", vms.len(), server_uuid);
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
    
    pub async fn get_vm_jobs(&self, vm_uuid: &str) -> Result<Vec<crate::api::vms::VmJob>, AppError> {
        info!("Fetching jobs for VM: {}", vm_uuid);
        
        // Construct the URL for the VMAPI jobs endpoint with vm_uuid filter
        let jobs_url = format!("{}/jobs?vm_uuid={}", self.base_url, vm_uuid);
        
        // Make the request to VMAPI
        let response = self.client
            .get(&jobs_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch jobs from VMAPI: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch jobs from VMAPI: {} - {}", status, error_text)));
        }
        
        // Try to parse the response directly into our VmJob struct
        let jobs = response
            .json::<Vec<crate::api::vms::VmJob>>()
            .await
            .map_err(|e| {
                info!("Error parsing VMAPI jobs response directly: {}", e);
                AppError::InternalServerError(format!("Failed to parse VMAPI jobs response: {}", e))
            })?;
        
        info!("Successfully fetched {} jobs for VM {}", jobs.len(), vm_uuid);
        Ok(jobs)
    }
    
    pub async fn list_jobs(
        &self,
        vm_uuid: Option<&str>,
        execution: Option<&str>,
        name: Option<&str>,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<Vec<crate::api::jobs::Job>, AppError> {
        info!("Listing jobs with filters: vm_uuid={:?}, execution={:?}, name={:?}", 
              vm_uuid, execution, name);
        
        // Construct the base URL for the VMAPI jobs endpoint
        let mut jobs_url = format!("{}/jobs", self.base_url);
        
        // Add filters as query parameters
        let mut query_params = Vec::new();
        
        if let Some(vm_uuid) = vm_uuid {
            query_params.push(format!("vm_uuid={}", vm_uuid));
        }
        
        if let Some(execution) = execution {
            query_params.push(format!("execution={}", execution));
        }
        
        if let Some(name) = name {
            query_params.push(format!("name={}", name));
        }
        
        if let Some(limit) = limit {
            query_params.push(format!("limit={}", limit));
        }
        
        if let Some(offset) = offset {
            query_params.push(format!("offset={}", offset));
        }
        
        // Add the query parameters to the URL
        if !query_params.is_empty() {
            jobs_url = format!("{}?{}", jobs_url, query_params.join("&"));
        }
        
        // Make the request to VMAPI
        let response = self.client
            .get(&jobs_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch jobs from VMAPI: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch jobs from VMAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let jobs = response
            .json::<Vec<crate::api::jobs::Job>>()
            .await
            .map_err(|e| {
                info!("Error parsing VMAPI jobs response: {}", e);
                AppError::InternalServerError(format!("Failed to parse VMAPI jobs response: {}", e))
            })?;
            
        info!("Successfully fetched {} jobs from VMAPI", jobs.len());
        Ok(jobs)
    }
    
    pub async fn get_job(&self, uuid: &str) -> Result<crate::api::jobs::Job, AppError> {
        info!("Getting job {}", uuid);
        
        // Construct the URL for the VMAPI job endpoint
        let job_url = format!("{}/jobs/{}", self.base_url, uuid);
        
        // Make the request to VMAPI
        let response = self.client
            .get(&job_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch job from VMAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Job with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch job from VMAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let job = response
            .json::<crate::api::jobs::Job>()
            .await
            .map_err(|e| {
                info!("Error parsing VMAPI job response: {}", e);
                AppError::InternalServerError(format!("Failed to parse VMAPI job response: {}", e))
            })?;
            
        info!("Successfully fetched job {}", uuid);
        Ok(job)
    }
    
    pub async fn get_job_output(&self, uuid: &str) -> Result<String, AppError> {
        info!("Getting job output for {}", uuid);
        
        // Construct the URL for the VMAPI job output endpoint
        let job_output_url = format!("{}/jobs/{}/output", self.base_url, uuid);
        
        // Make the request to VMAPI
        let response = self.client
            .get(&job_output_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch job output from VMAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Output for job with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch job output from VMAPI: {} - {}", status, error_text)));
        }
        
        // Get the text response (job output is plain text)
        let output = response
            .text()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to read job output text: {}", e)))?;
            
        info!("Successfully fetched output for job {}", uuid);
        Ok(output)
    }
}