use serde::{Deserialize, Serialize};
use uuid::Uuid;
use anyhow::Result;
use tracing::info;

use crate::error::AppError;

pub struct PapiService {
    client: reqwest::Client,
    base_url: String,
}

impl PapiService {
    pub fn new(base_url: String) -> Self {
        info!("Initializing PAPI service with URL: {}", base_url);
        Self {
            client: reqwest::Client::new(),
            base_url,
        }
    }
    
    pub async fn list_packages(&self) -> Result<Vec<crate::api::packages::Package>, AppError> {
        info!("Fetching package list from PAPI");
        
        // Construct the URL for the PAPI packages endpoint
        let packages_url = format!("{}/packages", self.base_url);
        
        // Make the request to PAPI
        let response = self.client
            .get(&packages_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch packages from PAPI: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch packages from PAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let packages_data: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse PAPI response: {}", e)))?;
            
        // Convert the response data to our Package model
        let packages: Vec<crate::api::packages::Package> = packages_data
            .into_iter()
            .filter_map(|package_data| {
                let uuid = package_data["uuid"].as_str()?;
                let name = package_data["name"].as_str()?;
                let version = package_data["version"].as_str()?;
                let memory = package_data["memory"].as_u64()?;
                let disk = package_data["disk"].as_u64()?;
                let vcpus = package_data["vcpus"].as_u64()? as u32;
                let active = package_data["active"].as_bool().unwrap_or(true);
                
                let description = package_data["description"].as_str().map(|s| s.to_string());
                
                let created_at = package_data["created_at"].as_str().unwrap_or("").to_string();
                let updated_at = package_data["updated_at"].as_str().unwrap_or("").to_string();
                
                Some(crate::api::packages::Package {
                    uuid: uuid.to_string(),
                    name: name.to_string(),
                    version: version.to_string(),
                    memory,
                    disk,
                    vcpus,
                    active,
                    description,
                    created_at,
                    updated_at,
                })
            })
            .collect();
            
        info!("Successfully fetched {} packages from PAPI", packages.len());
        Ok(packages)
    }
    
    pub async fn get_package(&self, uuid: &str) -> Result<crate::api::packages::Package, AppError> {
        info!("Fetching package with UUID: {}", uuid);
        
        // Construct the URL for the PAPI package endpoint
        let package_url = format!("{}/packages/{}", self.base_url, uuid);
        
        // Make the request to PAPI
        let response = self.client
            .get(&package_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch package from PAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Package with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch package from PAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let package_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse PAPI response: {}", e)))?;
            
        // Extract the required fields from the response
        let name = package_data["name"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Name not found in PAPI response".to_string()))?;
            
        let version = package_data["version"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Version not found in PAPI response".to_string()))?;
            
        let memory = package_data["memory"]
            .as_u64()
            .ok_or_else(|| AppError::InternalServerError("Memory not found in PAPI response".to_string()))?;
            
        let disk = package_data["disk"]
            .as_u64()
            .ok_or_else(|| AppError::InternalServerError("Disk not found in PAPI response".to_string()))?;
            
        let vcpus = package_data["vcpus"]
            .as_u64()
            .ok_or_else(|| AppError::InternalServerError("VCPUs not found in PAPI response".to_string()))? as u32;
            
        let active = package_data["active"].as_bool().unwrap_or(true);
        
        let description = package_data["description"].as_str().map(|s| s.to_string());
        
        let created_at = package_data["created_at"].as_str().unwrap_or("").to_string();
        let updated_at = package_data["updated_at"].as_str().unwrap_or("").to_string();
        
        let package = crate::api::packages::Package {
            uuid: uuid.to_string(),
            name: name.to_string(),
            version: version.to_string(),
            memory,
            disk,
            vcpus,
            active,
            description,
            created_at,
            updated_at,
        };
        
        info!("Successfully fetched package {} ({})", uuid, name);
        Ok(package)
    }
    
    pub async fn create_package(
        &self, 
        package: crate::api::packages::CreatePackageRequest
    ) -> Result<crate::api::packages::Package, AppError> {
        info!("Creating new package with name: {}", package.name);
        
        // Construct the URL for the PAPI packages endpoint
        let packages_url = format!("{}/packages", self.base_url);
        
        // Make the request to PAPI
        let response = self.client
            .post(&packages_url)
            .json(&package)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to create package with PAPI: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to create package with PAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let package_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse PAPI response: {}", e)))?;
            
        // Extract the UUID from the response
        let uuid = package_data["uuid"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("UUID not found in PAPI response".to_string()))?;
            
        info!("Successfully created package {} ({})", uuid, package.name);
        
        // Get the full package details
        self.get_package(uuid).await
    }
    
    pub async fn update_package(
        &self, 
        uuid: &str, 
        package: crate::api::packages::UpdatePackageRequest
    ) -> Result<crate::api::packages::Package, AppError> {
        info!("Updating package with UUID: {}", uuid);
        
        // Construct the URL for the PAPI package endpoint
        let package_url = format!("{}/packages/{}", self.base_url, uuid);
        
        // Make the request to PAPI
        let response = self.client
            .put(&package_url)
            .json(&package)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to update package with PAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Package with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to update package with PAPI: {} - {}", status, error_text)));
        }
        
        info!("Successfully updated package {}", uuid);
        
        // Get the updated package
        self.get_package(uuid).await
    }
}