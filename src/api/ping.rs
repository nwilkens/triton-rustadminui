use actix_web::{get, HttpResponse, Responder};
use chrono::Utc;
use serde::Serialize;

#[derive(Serialize)]
struct PingResponse {
    services: ServiceStatus,
    time: String,
}

#[derive(Serialize)]
struct ServiceStatus {
    #[serde(rename = "moray")]
    moray_connected: bool,
    #[serde(rename = "ufds")]
    ufds_connected: bool,
}

#[get("/ping")]
pub async fn ping() -> impl Responder {
    // In a production system, these would be actual connection checks
    // For now, we'll just return placeholders
    let response = PingResponse {
        services: ServiceStatus {
            moray_connected: true,
            ufds_connected: true,
        },
        time: Utc::now().to_rfc3339(),
    };
    
    HttpResponse::Ok().json(response)
}