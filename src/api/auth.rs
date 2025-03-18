use actix_web::{
    post, get, delete,
    web::{self, Data, Json},
    HttpResponse,
};
use serde::{Deserialize, Serialize};

use crate::auth::{authenticate, AuthenticatedUser, LoginRequest, LoginResponse};
use crate::config::Config;
use crate::error::AppError;

#[post("/auth")]
pub async fn login(
    config: Data<Config>,
    login_req: Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    // Call our authentication function which will verify credentials against UFDS via LDAPS
    let response = authenticate(&config, &login_req.username, &login_req.password).await?;
    
    // Return success with JWT token and user info
    Ok(HttpResponse::Ok().json(response))
}

#[delete("/auth")]
pub async fn logout() -> HttpResponse {
    // In a stateful auth system, we would invalidate the token here
    // Since JWTs are stateless, the client just needs to remove the token
    HttpResponse::Ok().finish()
}

#[derive(Serialize)]
struct UserResponse {
    id: String,
    name: String,
    email: String,
    roles: Vec<String>,
}

#[get("/auth")]
pub async fn get_current_user(user: AuthenticatedUser) -> Result<HttpResponse, AppError> {
    let user_data = UserResponse {
        id: user.id.to_string(),
        name: user.name,
        email: user.email,
        roles: user.roles,
    };
    
    Ok(HttpResponse::Ok().json(user_data))
}