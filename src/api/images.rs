use actix_web::{get, put, patch, web::{self, Data, Json, Path, Query}, HttpResponse};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageListParams {
    pub name: Option<String>,
    pub os: Option<String>,
    pub state: Option<String>,
    pub owner: Option<String>,
    pub public: Option<bool>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Image {
    pub uuid: String,
    pub name: String,
    pub version: String,
    pub os: String,
    pub state: String,
    pub owner: Option<String>,
    pub public: bool,
    pub published_at: String,
    pub files: Vec<ImageFile>,
    pub requirements: serde_json::Value,
    pub tags: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageFile {
    pub sha1: String,
    pub size: u64,
    pub compression: String,
}

#[get("")]
pub async fn list_images(
    _user: AuthenticatedUser,
    config: Data<Config>,
    query: Query<ImageListParams>,
) -> Result<HttpResponse, AppError> {
    // Create IMGAPI service client
    let imgapi_service = crate::services::ImgapiService::new(config.imgapi_url.clone());
    
    // Get images from IMGAPI
    let images = imgapi_service.list_images().await?;
    
    // If there are filtering parameters, apply them
    let filtered_images = if query.name.is_some() || query.os.is_some() || query.state.is_some() || query.owner.is_some() || query.public.is_some() {
        images.into_iter().filter(|image| {
            let name_match = match &query.name {
                Some(name) => image.name.contains(name),
                None => true,
            };
            
            let os_match = match &query.os {
                Some(os) => image.os == *os,
                None => true,
            };
            
            let state_match = match &query.state {
                Some(state) => image.state == *state,
                None => true,
            };
            
            let owner_match = match &query.owner {
                Some(owner) => image.owner.as_ref().map_or(false, |img_owner| img_owner == owner),
                None => true,
            };
            
            let public_match = match query.public {
                Some(public) => image.public == public,
                None => true,
            };
            
            name_match && os_match && state_match && owner_match && public_match
        }).collect()
    } else {
        images
    };
    
    // Apply pagination if specified
    let paginated_images = match (query.offset, query.limit) {
        (Some(offset), Some(limit)) => {
            let offset = offset as usize;
            let limit = limit as usize;
            filtered_images.into_iter().skip(offset).take(limit).collect()
        },
        (Some(offset), None) => {
            let offset = offset as usize;
            filtered_images.into_iter().skip(offset).collect()
        },
        (None, Some(limit)) => {
            let limit = limit as usize;
            filtered_images.into_iter().take(limit).collect()
        },
        (None, None) => filtered_images,
    };
    
    Ok(HttpResponse::Ok().json(paginated_images))
}

#[get("/{uuid}")]
pub async fn get_image(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // Create IMGAPI service client
    let imgapi_service = crate::services::ImgapiService::new(config.imgapi_url.clone());
    
    // Get image from IMGAPI
    let image = imgapi_service.get_image(&uuid).await?;
    
    Ok(HttpResponse::Ok().json(image))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateImageRequest {
    pub name: Option<String>,
    pub version: Option<String>,
    pub public: Option<bool>,
    pub tags: Option<serde_json::Value>,
}

#[patch("/{uuid}")]
pub async fn update_image(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
    image_req: Json<UpdateImageRequest>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // Create IMGAPI service client
    let imgapi_service = crate::services::ImgapiService::new(config.imgapi_url.clone());
    
    // Update image via IMGAPI
    let image = imgapi_service.update_image(&uuid, image_req.0).await?;
    
    Ok(HttpResponse::Ok().json(image))
}