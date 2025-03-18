use actix_web::{
    body::EitherBody,
    dev::{self, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage, HttpRequest, HttpResponse,
};
use futures::future::{ok, Ready};
use std::future::{Future};
use std::pin::Pin;
use std::task::{Context, Poll};
use uuid::Uuid;
use crate::auth::{AuthenticatedUser, verify_token};
use tracing::info;

// JWT authentication middleware
pub struct AuthMiddleware {
    pub jwt_secret: String,
}

impl AuthMiddleware {
    pub fn new(jwt_secret: String) -> Self {
        Self { jwt_secret }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(AuthMiddlewareService { 
            service,
            jwt_secret: self.jwt_secret.clone(),
        })
    }
}

pub struct AuthMiddlewareService<S> {
    service: S,
    jwt_secret: String,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        // Clone JWT secret for async block
        let jwt_secret = self.jwt_secret.clone();
        
        // Allow OPTIONS requests for CORS
        if req.method() == actix_web::http::Method::OPTIONS {
            let fut = self.service.call(req);
            return Box::pin(async move {
                let res = fut.await?;
                Ok(res.map_into_left_body())
            });
        }

        // Extract authorization header
        if let Some(auth_header) = req.headers().get("Authorization") {
            if let Ok(auth_str) = auth_header.to_str() {
                if auth_str.starts_with("Bearer ") {
                    let token = &auth_str[7..]; // Skip "Bearer " prefix
                    
                    // Verify token
                    match verify_token(token, &jwt_secret) {
                        Ok(claims) => {
                            // Create user from claims
                            let user = AuthenticatedUser {
                                id: Uuid::parse_str(&claims.sub).unwrap_or_else(|_| Uuid::nil()),
                                name: claims.name,
                                email: claims.email,
                                roles: claims.roles,
                            };
                            
                            // Add user to request extensions
                            req.extensions_mut().insert(user);
                            
                            // Continue with the request
                            let fut = self.service.call(req);
                            return Box::pin(async move {
                                let res = fut.await?;
                                Ok(res.map_into_left_body())
                            });
                        },
                        Err(e) => {
                            info!("Invalid token: {}", e);
                            let (request, _) = req.into_parts();
                            let response = HttpResponse::Unauthorized()
                                .json(serde_json::json!({ "error": format!("Invalid token: {}", e) }));
                            
                            return Box::pin(async move {
                                Ok(ServiceResponse::new(request, response).map_into_right_body())
                            });
                        }
                    }
                } else {
                    info!("Invalid authorization header format");
                    let (request, _) = req.into_parts();
                    let response = HttpResponse::Unauthorized()
                        .json(serde_json::json!({ "error": "Invalid authorization header format" }));
                    
                    return Box::pin(async move {
                        Ok(ServiceResponse::new(request, response).map_into_right_body())
                    });
                }
            } else {
                info!("Invalid authorization header");
                let (request, _) = req.into_parts();
                let response = HttpResponse::Unauthorized()
                    .json(serde_json::json!({ "error": "Invalid authorization header" }));
                
                return Box::pin(async move {
                    Ok(ServiceResponse::new(request, response).map_into_right_body())
                });
            }
        } else {
            info!("Missing authorization header");
            let (request, _) = req.into_parts();
            let response = HttpResponse::Unauthorized()
                .json(serde_json::json!({ "error": "Missing authorization header" }));
            
            return Box::pin(async move {
                Ok(ServiceResponse::new(request, response).map_into_right_body())
            });
        }
    }
}

// For backward compatibility
pub type DummyMiddleware = AuthMiddleware;