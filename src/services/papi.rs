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
        
        // Parse the response JSON directly into our Package model
        let packages: Vec<crate::api::packages::Package> = response
            .json()
            .await
            .map_err(|e| {
                info!("Error parsing PAPI response: {}", e);
                AppError::InternalServerError(format!("Failed to parse PAPI response: {}", e))
            })?;
        
        for pkg in &packages {
            info!("Found package: {} ({})", pkg.name, pkg.uuid);
        }
            
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
        
        // Parse the response JSON directly into our Package model
        let package: crate::api::packages::Package = response
            .json()
            .await
            .map_err(|e| {
                info!("Error parsing PAPI response: {}", e);
                AppError::InternalServerError(format!("Failed to parse PAPI response: {}", e))
            })?;
        
        info!("Successfully fetched package {} ({})", uuid, package.name);
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