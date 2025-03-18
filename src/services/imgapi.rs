use serde::{Deserialize, Serialize};
use uuid::Uuid;
use anyhow::Result;
use tracing::info;

use crate::error::AppError;

pub struct ImgapiService {
    client: reqwest::Client,
    base_url: String,
}

impl ImgapiService {
    pub fn new(base_url: String) -> Self {
        info!("Initializing IMGAPI service with URL: {}", base_url);
        Self {
            client: reqwest::Client::new(),
            base_url,
        }
    }
    
    pub async fn list_images(&self) -> Result<Vec<crate::api::images::Image>, AppError> {
        info!("Fetching image list from IMGAPI");
        
        // Construct the URL for the IMGAPI images endpoint
        let images_url = format!("{}/images", self.base_url);
        
        // Make the request to IMGAPI
        let response = self.client
            .get(&images_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch images from IMGAPI: {}", e)))?;
            
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch images from IMGAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let images_data: Vec<serde_json::Value> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse IMGAPI response: {}", e)))?;
            
        // Convert the response data to our Image model
        let images: Vec<crate::api::images::Image> = images_data
            .into_iter()
            .filter_map(|image_data| {
                let uuid = image_data["uuid"].as_str()?;
                let name = image_data["name"].as_str()?;
                let version = image_data["version"].as_str()?;
                let os = image_data["os"].as_str()?;
                let state = image_data["state"].as_str()?;
                let public = image_data["public"].as_bool().unwrap_or(false);
                let published_at = image_data["published_at"].as_str().unwrap_or("");
                
                let owner = image_data["owner"].as_str().map(|s| s.to_string());
                
                // Extract file information
                let mut files = Vec::new();
                if let Some(files_data) = image_data["files"].as_array() {
                    for file_data in files_data {
                        let sha1 = file_data["sha1"].as_str()?;
                        let size = file_data["size"].as_u64()?;
                        let compression = file_data["compression"].as_str()?;
                        
                        files.push(crate::api::images::ImageFile {
                            sha1: sha1.to_string(),
                            size,
                            compression: compression.to_string(),
                        });
                    }
                }
                
                // Extract requirements and tags
                let requirements = image_data["requirements"].clone();
                let tags = image_data["tags"].clone();
                
                Some(crate::api::images::Image {
                    uuid: uuid.to_string(),
                    name: name.to_string(),
                    version: version.to_string(),
                    os: os.to_string(),
                    state: state.to_string(),
                    owner,
                    public,
                    published_at: published_at.to_string(),
                    files,
                    requirements,
                    tags,
                })
            })
            .collect();
            
        info!("Successfully fetched {} images from IMGAPI", images.len());
        Ok(images)
    }
    
    pub async fn get_image(&self, uuid: &str) -> Result<crate::api::images::Image, AppError> {
        info!("Fetching image with UUID: {}", uuid);
        
        // Construct the URL for the IMGAPI image endpoint
        let image_url = format!("{}/images/{}", self.base_url, uuid);
        
        // Make the request to IMGAPI
        let response = self.client
            .get(&image_url)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to fetch image from IMGAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Image with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to fetch image from IMGAPI: {} - {}", status, error_text)));
        }
        
        // Parse the response JSON
        let image_data: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse IMGAPI response: {}", e)))?;
            
        // Extract the required fields from the response
        let name = image_data["name"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Name not found in IMGAPI response".to_string()))?;
            
        let version = image_data["version"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("Version not found in IMGAPI response".to_string()))?;
            
        let os = image_data["os"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("OS not found in IMGAPI response".to_string()))?;
            
        let state = image_data["state"]
            .as_str()
            .ok_or_else(|| AppError::InternalServerError("State not found in IMGAPI response".to_string()))?;
            
        let public = image_data["public"].as_bool().unwrap_or(false);
        let published_at = image_data["published_at"].as_str().unwrap_or("");
        
        let owner = image_data["owner"].as_str().map(|s| s.to_string());
        
        // Extract file information
        let mut files = Vec::new();
        if let Some(files_data) = image_data["files"].as_array() {
            for file_data in files_data {
                if let (Some(sha1), Some(size), Some(compression)) = (
                    file_data["sha1"].as_str(),
                    file_data["size"].as_u64(),
                    file_data["compression"].as_str(),
                ) {
                    files.push(crate::api::images::ImageFile {
                        sha1: sha1.to_string(),
                        size,
                        compression: compression.to_string(),
                    });
                }
            }
        }
        
        // Extract requirements and tags
        let requirements = image_data["requirements"].clone();
        let tags = image_data["tags"].clone();
        
        let image = crate::api::images::Image {
            uuid: uuid.to_string(),
            name: name.to_string(),
            version: version.to_string(),
            os: os.to_string(),
            state: state.to_string(),
            owner,
            public,
            published_at: published_at.to_string(),
            files,
            requirements,
            tags,
        };
        
        info!("Successfully fetched image {} ({})", uuid, name);
        Ok(image)
    }
    
    pub async fn update_image(
        &self, 
        uuid: &str, 
        image: crate::api::images::UpdateImageRequest
    ) -> Result<crate::api::images::Image, AppError> {
        info!("Updating image with UUID: {}", uuid);
        
        // Construct the URL for the IMGAPI image endpoint
        let image_url = format!("{}/images/{}", self.base_url, uuid);
        
        // Make the request to IMGAPI
        let response = self.client
            .post(&image_url)
            .json(&image)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to update image with IMGAPI: {}", e)))?;
            
        if response.status().is_client_error() {
            return Err(AppError::NotFound(format!("Image with UUID {} not found", uuid)));
        }
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::InternalServerError(format!("Failed to update image with IMGAPI: {} - {}", status, error_text)));
        }
        
        info!("Successfully updated image {}", uuid);
        
        // Get the updated image
        self.get_image(uuid).await
    }
}