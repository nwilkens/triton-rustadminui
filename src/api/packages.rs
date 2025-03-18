use actix_web::{get, post, put, patch, web::{self, Data, Json, Path, Query}, HttpResponse};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct PackageListParams {
    pub name: Option<String>,
    pub memory: Option<u64>,
    pub vcpus: Option<u32>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Package {
    pub uuid: String,
    pub name: String,
    pub version: String,
    pub memory: u64,
    pub disk: u64,
    pub vcpus: u32,
    pub active: bool,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[get("")]
pub async fn list_packages(
    _user: AuthenticatedUser,
    config: Data<Config>,
    query: Query<PackageListParams>,
) -> Result<HttpResponse, AppError> {
    // Create PAPI service client
    let papi_service = crate::services::PapiService::new(config.papi_url.clone());
    
    // Get packages from PAPI
    let packages = papi_service.list_packages().await?;
    
    // If there are filtering parameters, apply them
    let filtered_packages = if query.name.is_some() || query.memory.is_some() || query.vcpus.is_some() {
        packages.into_iter().filter(|package| {
            let name_match = match &query.name {
                Some(name) => package.name.contains(name),
                None => true,
            };
            
            let memory_match = match query.memory {
                Some(memory) => package.memory >= memory,
                None => true,
            };
            
            let vcpus_match = match query.vcpus {
                Some(vcpus) => package.vcpus >= vcpus,
                None => true,
            };
            
            name_match && memory_match && vcpus_match
        }).collect()
    } else {
        packages
    };
    
    // Apply pagination if specified
    let paginated_packages = match (query.offset, query.limit) {
        (Some(offset), Some(limit)) => {
            let offset = offset as usize;
            let limit = limit as usize;
            filtered_packages.into_iter().skip(offset).take(limit).collect()
        },
        (Some(offset), None) => {
            let offset = offset as usize;
            filtered_packages.into_iter().skip(offset).collect()
        },
        (None, Some(limit)) => {
            let limit = limit as usize;
            filtered_packages.into_iter().take(limit).collect()
        },
        (None, None) => filtered_packages,
    };
    
    Ok(HttpResponse::Ok().json(paginated_packages))
}

#[get("/{uuid}")]
pub async fn get_package(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // Create PAPI service client
    let papi_service = crate::services::PapiService::new(config.papi_url.clone());
    
    // Get package from PAPI
    let package = papi_service.get_package(&uuid).await?;
    
    Ok(HttpResponse::Ok().json(package))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePackageRequest {
    pub name: String,
    pub version: String,
    pub memory: u64,
    pub disk: u64,
    pub vcpus: u32,
    pub active: Option<bool>,
    pub description: Option<String>,
}

#[post("")]
pub async fn create_package(
    _user: AuthenticatedUser,
    config: Data<Config>,
    package_req: Json<CreatePackageRequest>,
) -> Result<HttpResponse, AppError> {
    // Create PAPI service client
    let papi_service = crate::services::PapiService::new(config.papi_url.clone());
    
    // Create package via PAPI
    let package = papi_service.create_package(package_req.0).await?;
    
    Ok(HttpResponse::Created().json(package))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePackageRequest {
    pub name: Option<String>,
    pub version: Option<String>,
    pub memory: Option<u64>,
    pub disk: Option<u64>,
    pub vcpus: Option<u32>,
    pub active: Option<bool>,
    pub description: Option<String>,
}

#[patch("/{uuid}")]
pub async fn update_package(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
    package_req: Json<UpdatePackageRequest>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // Create PAPI service client
    let papi_service = crate::services::PapiService::new(config.papi_url.clone());
    
    // Update package via PAPI
    let package = papi_service.update_package(&uuid, package_req.0).await?;
    
    Ok(HttpResponse::Ok().json(package))
}