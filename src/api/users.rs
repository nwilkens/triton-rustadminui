use actix_web::{
    get, post, put, delete, patch,
    web::{self, Data, Json, Path, Query},
    HttpResponse,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserListParams {
    pub email: Option<String>,
    pub login: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub uuid: String,
    pub login: String,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub company: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub approved_for_provisioning: bool,
}

#[get("")]
pub async fn list_users(
    _user: AuthenticatedUser,
    config: Data<Config>,
    query: Query<UserListParams>,
) -> Result<HttpResponse, AppError> {
    // In a real implementation, this would call the UFDS client to list users
    // For now, we'll just return a placeholder
    
    let users = vec![
        User {
            uuid: Uuid::new_v4().to_string(),
            login: "user1".to_string(),
            email: "user1@example.com".to_string(),
            first_name: Some("User".to_string()),
            last_name: Some("One".to_string()),
            company: None,
            created_at: "2023-01-01T00:00:00Z".to_string(),
            updated_at: "2023-01-01T00:00:00Z".to_string(),
            approved_for_provisioning: true,
        },
        User {
            uuid: Uuid::new_v4().to_string(),
            login: "user2".to_string(),
            email: "user2@example.com".to_string(),
            first_name: Some("User".to_string()),
            last_name: Some("Two".to_string()),
            company: Some("Example Corp".to_string()),
            created_at: "2023-01-02T00:00:00Z".to_string(),
            updated_at: "2023-01-02T00:00:00Z".to_string(),
            approved_for_provisioning: false,
        },
    ];
    
    Ok(HttpResponse::Ok().json(users))
}

#[get("/{uuid}")]
pub async fn get_user(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // In a real implementation, this would call the UFDS client to get a user
    // For now, we'll just return a placeholder
    
    let user = User {
        uuid,
        login: "user1".to_string(),
        email: "user1@example.com".to_string(),
        first_name: Some("User".to_string()),
        last_name: Some("One".to_string()),
        company: None,
        created_at: "2023-01-01T00:00:00Z".to_string(),
        updated_at: "2023-01-01T00:00:00Z".to_string(),
        approved_for_provisioning: true,
    };
    
    Ok(HttpResponse::Ok().json(user))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub login: String,
    pub email: String,
    pub password: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub company: Option<String>,
    pub approved_for_provisioning: Option<bool>,
}

#[post("")]
pub async fn create_user(
    _user: AuthenticatedUser,
    config: Data<Config>,
    user_req: Json<CreateUserRequest>,
) -> Result<HttpResponse, AppError> {
    // In a real implementation, this would call the UFDS client to create a user
    // For now, we'll just return a placeholder
    
    let user = User {
        uuid: Uuid::new_v4().to_string(),
        login: user_req.login.clone(),
        email: user_req.email.clone(),
        first_name: user_req.first_name.clone(),
        last_name: user_req.last_name.clone(),
        company: user_req.company.clone(),
        created_at: "2023-01-01T00:00:00Z".to_string(),
        updated_at: "2023-01-01T00:00:00Z".to_string(),
        approved_for_provisioning: user_req.approved_for_provisioning.unwrap_or(false),
    };
    
    Ok(HttpResponse::Created().json(user))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub company: Option<String>,
    pub approved_for_provisioning: Option<bool>,
}

#[put("/{uuid}")]
pub async fn update_user(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
    user_req: Json<UpdateUserRequest>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // In a real implementation, this would call the UFDS client to update a user
    // For now, we'll just return a placeholder
    
    let user = User {
        uuid,
        login: "user1".to_string(),
        email: user_req.email.clone().unwrap_or_else(|| "user1@example.com".to_string()),
        first_name: user_req.first_name.clone(),
        last_name: user_req.last_name.clone(),
        company: user_req.company.clone(),
        created_at: "2023-01-01T00:00:00Z".to_string(),
        updated_at: "2023-01-01T00:00:00Z".to_string(),
        approved_for_provisioning: user_req.approved_for_provisioning.unwrap_or(true),
    };
    
    Ok(HttpResponse::Ok().json(user))
}

#[patch("/{uuid}")]
pub async fn update_user_partial(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
    user_req: Json<UpdateUserRequest>,
) -> Result<HttpResponse, AppError> {
    // In a real implementation, this would be handled differently from PUT
    // For now, we'll implement the same logic as PUT
    let uuid = path.into_inner();
    
    // In a real implementation, this would call the UFDS client to update a user
    // For now, we'll just return a placeholder
    
    let user = User {
        uuid,
        login: "user1".to_string(),
        email: user_req.email.clone().unwrap_or_else(|| "user1@example.com".to_string()),
        first_name: user_req.first_name.clone(),
        last_name: user_req.last_name.clone(),
        company: user_req.company.clone(),
        created_at: "2023-01-01T00:00:00Z".to_string(),
        updated_at: "2023-01-01T00:00:00Z".to_string(),
        approved_for_provisioning: user_req.approved_for_provisioning.unwrap_or(true),
    };
    
    Ok(HttpResponse::Ok().json(user))
}

#[delete("/{uuid}")]
pub async fn delete_user(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // In a real implementation, this would call the UFDS client to delete a user
    // For now, we'll just return a placeholder
    
    Ok(HttpResponse::NoContent().finish())
}