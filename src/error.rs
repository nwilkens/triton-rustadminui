use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use serde::Serialize;
use thiserror::Error;
use std::fmt;
use tracing::error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Authentication error: {0}")]
    AuthError(String),

    #[error("Authorization error: {0}")]
    AuthorizationError(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Internal server error: {0}")]
    InternalServerError(String),

    #[error("Service unavailable: {0}")]
    ServiceUnavailable(String),
    
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("JSON serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),
}

#[derive(Serialize)]
struct ErrorResponse {
    code: String,
    message: String,
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let status = self.status_code();
        
        // Log the error with details for server logs
        error!("Error occurred: {self}");
        
        // Simplified client-facing error
        let code = match self {
            AppError::AuthError(_) => "AuthError",
            AppError::AuthorizationError(_) => "AuthorizationError",
            AppError::NotFound(_) => "NotFound",
            AppError::BadRequest(_) => "BadRequest",
            AppError::InternalServerError(_) => "InternalServerError",
            AppError::ServiceUnavailable(_) => "ServiceUnavailable",
            AppError::DatabaseError(_) => "DatabaseError",
            AppError::ValidationError(_) => "ValidationError",
            AppError::SerializationError(_) => "SerializationError",
        };
        
        let response = ErrorResponse {
            code: code.to_string(),
            message: self.to_string(),
        };
        
        HttpResponse::build(status)
            .json(response)
    }

    fn status_code(&self) -> StatusCode {
        match self {
            AppError::AuthError(_) => StatusCode::UNAUTHORIZED,
            AppError::AuthorizationError(_) => StatusCode::FORBIDDEN,
            AppError::NotFound(_) => StatusCode::NOT_FOUND,
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::ValidationError(_) => StatusCode::BAD_REQUEST,
            AppError::InternalServerError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::ServiceUnavailable(_) => StatusCode::SERVICE_UNAVAILABLE,
            AppError::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::SerializationError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}