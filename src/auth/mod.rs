use actix_web::{
    dev::Payload, Error as ActixError, FromRequest, HttpMessage, HttpRequest,
    web::{self, Data},
};
use futures::future::{ready, Ready};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::future::Future;
use std::pin::Pin;
use chrono::{DateTime, Duration, Utc};
use uuid::Uuid;

use crate::config::Config;
use crate::error::AppError;

pub mod middleware;

pub use middleware::DummyMiddleware;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,            // Subject (user UUID)
    pub name: String,           // User's name
    pub email: String,          // User's email
    pub roles: Vec<String>,     // User's roles
    pub exp: i64,               // Expiration time (standard claim)
    pub iat: i64,               // Issued at (standard claim)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub name: String,
    pub email: String,
    pub roles: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub roles: Vec<String>,
}

impl FromRequest for AuthenticatedUser {
    type Error = ActixError;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _: &mut Payload) -> Self::Future {
        if let Some(user) = req.extensions().get::<AuthenticatedUser>() {
            ready(Ok(user.clone()))
        } else {
            ready(Err(ActixError::from(AppError::AuthError(
                "User not authenticated".to_string(),
            ))))
        }
    }
}

pub async fn authenticate(
    config: &Config,
    username: &str,
    password: &str,
) -> Result<LoginResponse, AppError> {
    // Use UFDS service for authentication
    let ufds_service = crate::services::UfdsService::new(config.ufds_url.clone());
    
    // Authenticate against UFDS
    let (user_id, name, email, roles) = ufds_service.authenticate(username, password).await?;
    
    let user_info = UserInfo {
        id: user_id.clone(),
        name,
        email,
        roles,
    };
    
    // Create JWT token
    let token = create_token(
        &config.jwt_secret,
        &user_id,
        &user_info.name,
        &user_info.email,
        &user_info.roles,
        config.jwt_expiration,
    )?;
    
    Ok(LoginResponse {
        token,
        user: user_info,
    })
}

fn create_token(
    secret: &str,
    user_id: &str,
    name: &str,
    email: &str,
    roles: &[String],
    expiration_hours: i64,
) -> Result<String, AppError> {
    let now = Utc::now();
    let expires_at = now + Duration::hours(expiration_hours);
    
    let claims = Claims {
        sub: user_id.to_string(),
        name: name.to_string(),
        email: email.to_string(),
        roles: roles.to_vec(),
        iat: now.timestamp(),
        exp: expires_at.timestamp(),
    };
    
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::AuthError(format!("Error creating token: {}", e)))
}

pub fn verify_token(token: &str, secret: &str) -> Result<Claims, AppError> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|e| AppError::AuthError(format!("Invalid token: {}", e)))?;
    
    Ok(token_data.claims)
}