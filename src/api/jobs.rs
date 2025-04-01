use actix_web::{
    get,
    web::{self, Data, Path, Query},
    HttpResponse,
};
use serde::{Deserialize, Serialize};
use tracing::info;

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::AppError;
use crate::services::VmapiService;

#[derive(Debug, Serialize, Deserialize)]
pub struct JobListParams {
    pub vm_uuid: Option<String>,
    pub execution: Option<String>,
    pub name: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChainResult {
    pub result: String,
    pub error: String,
    pub name: String,
    pub started_at: Option<String>,
    pub finished_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Job {
    pub uuid: String,
    pub name: String,
    pub execution: String,
    pub params: Option<serde_json::Value>,
    pub exec_after: Option<String>,
    pub created_at: String,
    pub timeout: Option<u32>,
    pub chain_results: Option<Vec<ChainResult>>,
    pub elapsed: Option<String>,
}

#[get("")]
pub async fn list_jobs(
    _user: AuthenticatedUser,
    config: Data<Config>,
    query: Query<JobListParams>,
) -> Result<HttpResponse, AppError> {
    // Create an instance of the VMAPI service
    info!("Listing Jobs using VMAPI service");
    let vmapi_service = VmapiService::new(config.vmapi_url.clone());
    
    // Call the service to get all jobs (filtering will be done in the service)
    let jobs = vmapi_service.list_jobs(
        query.vm_uuid.as_deref(),
        query.execution.as_deref(),
        query.name.as_deref(),
        query.limit,
        query.offset,
    ).await?;
    
    // Return the jobs as JSON
    Ok(HttpResponse::Ok().json(jobs))
}

#[get("/{uuid}")]
pub async fn get_job(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // Create an instance of the VMAPI service
    info!("Getting Job {} using VMAPI service", uuid);
    let vmapi_service = VmapiService::new(config.vmapi_url.clone());
    
    // Call the service to get the job
    let job = vmapi_service.get_job(&uuid).await?;
    
    // Return the job as JSON
    Ok(HttpResponse::Ok().json(job))
}

#[get("/{uuid}/output")]
pub async fn get_job_output(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // Create an instance of the VMAPI service
    info!("Getting Job output for {} using VMAPI service", uuid);
    let vmapi_service = VmapiService::new(config.vmapi_url.clone());
    
    // Call the service to get the job output
    let output = vmapi_service.get_job_output(&uuid).await?;
    
    // Return the output as plain text
    Ok(HttpResponse::Ok().content_type("text/plain").body(output))
}