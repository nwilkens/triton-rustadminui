use actix_web::{
    get, post, put, delete, patch,
    web::{self, Data, Json, Path, Query},
    HttpResponse,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use tracing::info;

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::AppError;
use crate::services::VmapiService;

#[derive(Debug, Serialize, Deserialize)]
pub struct VmListParams {
    pub owner_uuid: Option<String>,
    pub state: Option<String>,
    pub alias: Option<String>,
    pub tag: Option<String>,
    pub server_uuid: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Vm {
    pub uuid: String,
    pub alias: String,
    pub state: String,
    pub brand: String,
    #[serde(rename = "ram")]
    pub memory: u64,
    // Disk can be in either quota or disk field
    #[serde(default)]
    pub quota: u64, 
    #[serde(default)]
    pub disk: u64,
    #[serde(default)]
    pub vcpus: u32,
    // IPs are extracted from nics
    #[serde(skip, default)]
    pub ips: Vec<String>,
    pub owner_uuid: String,
    #[serde(default)]
    pub image_uuid: String,
    #[serde(rename = "billing_id", default)]
    pub package_uuid: String,
    #[serde(default)]
    pub server_uuid: String,
    #[serde(rename = "create_timestamp", default)]
    pub created_at: String,
    #[serde(default)]
    pub tags: serde_json::Value,
    #[serde(default)]
    pub customer_metadata: serde_json::Value,
    #[serde(default)]
    pub internal_metadata: serde_json::Value,
    // Ensure nics is passed through without modification
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nics: Option<Vec<serde_json::Value>>,
}

#[get("")]
pub async fn list_vms(
    _user: AuthenticatedUser,
    config: Data<Config>,
    query: Query<VmListParams>,
) -> Result<HttpResponse, AppError> {
    // Create an instance of the VMAPI service
    info!("Listing VMs using VMAPI service");
    let vmapi_service = VmapiService::new(config.vmapi_url.clone());
    
    // Check if server_uuid filter is applied
    if let Some(server_uuid) = &query.server_uuid {
        info!("Filtering VMs by server_uuid: {}", server_uuid);
        // Call the service to get the VMs for the specified server
        let vms = vmapi_service.list_vms_by_server(server_uuid).await?;
        return Ok(HttpResponse::Ok().json(vms));
    }
    
    // Call the service to get all VMs
    let vms = vmapi_service.list_vms().await?;
    
    // Return the VMs as JSON
    Ok(HttpResponse::Ok().json(vms))
}

#[get("/{uuid}")]
pub async fn get_vm(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // Create an instance of the VMAPI service
    info!("Getting VM {} using VMAPI service", uuid);
    let vmapi_service = VmapiService::new(config.vmapi_url.clone());
    
    // Call the service to get the VM
    let vm = vmapi_service.get_vm(&uuid).await?;
    
    // Return the VM as JSON
    Ok(HttpResponse::Ok().json(vm))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateVmRequest {
    pub alias: String,
    pub brand: String,
    pub image_uuid: String,
    pub package_uuid: String,
    pub owner_uuid: String,
    pub networks: Vec<String>,
    pub tags: Option<serde_json::Value>,
    pub customer_metadata: Option<serde_json::Value>,
}

#[post("")]
pub async fn create_vm(
    _user: AuthenticatedUser,
    _config: Data<Config>,
    vm_req: Json<CreateVmRequest>,
) -> Result<HttpResponse, AppError> {
    // In a real implementation, this would call the VMAPI client to create a VM
    // For now, we'll just return a placeholder
    
    let vm = Vm {
        uuid: Uuid::new_v4().to_string(),
        alias: vm_req.alias.clone(),
        state: "provisioning".to_string(),
        brand: vm_req.brand.clone(),
        memory: 1024,
        quota: 20480,
        disk: 20480,
        vcpus: 1,
        ips: vec![],
        owner_uuid: vm_req.owner_uuid.clone(),
        image_uuid: vm_req.image_uuid.clone(),
        package_uuid: vm_req.package_uuid.clone(),
        server_uuid: Uuid::new_v4().to_string(),
        created_at: "2023-01-01T00:00:00Z".to_string(),
        tags: vm_req.tags.clone().unwrap_or(serde_json::json!({})),
        customer_metadata: vm_req.customer_metadata.clone().unwrap_or(serde_json::json!({})),
        internal_metadata: serde_json::json!({}),
        nics: None,
    };
    
    Ok(HttpResponse::Created().json(vm))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateVmRequest {
    pub alias: Option<String>,
    pub owner_uuid: Option<String>,
    pub tags: Option<serde_json::Value>,
    pub customer_metadata: Option<serde_json::Value>,
}

#[put("/{uuid}")]
pub async fn update_vm(
    _user: AuthenticatedUser,
    _config: Data<Config>,
    path: Path<String>,
    vm_req: Json<UpdateVmRequest>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // In a real implementation, this would call the VMAPI client to update a VM
    // For now, we'll just return a placeholder
    
    let vm = Vm {
        uuid,
        alias: vm_req.alias.clone().unwrap_or_else(|| "test-vm".to_string()),
        state: "running".to_string(),
        brand: "kvm".to_string(),
        memory: 1024,
        quota: 20480,
        disk: 20480,
        vcpus: 1,
        ips: vec!["10.0.0.1".to_string()],
        owner_uuid: vm_req.owner_uuid.clone().unwrap_or_else(|| Uuid::new_v4().to_string()),
        image_uuid: Uuid::new_v4().to_string(),
        package_uuid: Uuid::new_v4().to_string(),
        server_uuid: Uuid::new_v4().to_string(),
        created_at: "2023-01-01T00:00:00Z".to_string(),
        tags: vm_req.tags.clone().unwrap_or(serde_json::json!({"environment": "development"})),
        customer_metadata: vm_req.customer_metadata.clone().unwrap_or(serde_json::json!({})),
        internal_metadata: serde_json::json!({}),
        nics: None,
    };
    
    Ok(HttpResponse::Ok().json(vm))
}

#[patch("/{uuid}")]
pub async fn update_vm_partial(
    _user: AuthenticatedUser,
    _config: Data<Config>,
    path: Path<String>,
    vm_req: Json<UpdateVmRequest>,
) -> Result<HttpResponse, AppError> {
    // In a real implementation, this would be handled differently from PUT
    // For now, we'll implement the same logic as PUT
    let uuid = path.into_inner();
    
    // In a real implementation, this would call the VMAPI client to update a VM
    // For now, we'll just return a placeholder
    
    let vm = Vm {
        uuid,
        alias: vm_req.alias.clone().unwrap_or_else(|| "test-vm".to_string()),
        state: "running".to_string(),
        brand: "kvm".to_string(),
        memory: 1024,
        quota: 20480,
        disk: 20480,
        vcpus: 1,
        ips: vec!["10.0.0.1".to_string()],
        owner_uuid: vm_req.owner_uuid.clone().unwrap_or_else(|| Uuid::new_v4().to_string()),
        image_uuid: Uuid::new_v4().to_string(),
        package_uuid: Uuid::new_v4().to_string(),
        server_uuid: Uuid::new_v4().to_string(),
        created_at: "2023-01-01T00:00:00Z".to_string(),
        tags: vm_req.tags.clone().unwrap_or(serde_json::json!({"environment": "development"})),
        customer_metadata: vm_req.customer_metadata.clone().unwrap_or(serde_json::json!({})),
        internal_metadata: serde_json::json!({}),
        nics: None,
    };
    
    Ok(HttpResponse::Ok().json(vm))
}

#[delete("/{uuid}")]
pub async fn delete_vm(
    _user: AuthenticatedUser,
    _config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let _uuid = path.into_inner();
    
    // In a real implementation, this would call the VMAPI client to delete a VM
    // For now, we'll just return a placeholder
    
    Ok(HttpResponse::NoContent().finish())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VmActionRequest {
    pub action: String,
    pub params: Option<serde_json::Value>,
}

#[post("/{uuid}")]
pub async fn vm_action(
    _user: AuthenticatedUser,
    _config: Data<Config>,
    path: Path<String>,
    action_req: Json<VmActionRequest>,
) -> Result<HttpResponse, AppError> {
    let _uuid = path.into_inner();
    
    // In a real implementation, this would call the VMAPI client to perform an action on a VM
    // For now, we'll just return a placeholder
    
    match action_req.action.as_str() {
        "start" => {
            // Start VM
            Ok(HttpResponse::Accepted().json(serde_json::json!({
                "job_uuid": Uuid::new_v4().to_string()
            })))
        },
        "stop" => {
            // Stop VM
            Ok(HttpResponse::Accepted().json(serde_json::json!({
                "job_uuid": Uuid::new_v4().to_string()
            })))
        },
        "reboot" => {
            // Reboot VM
            Ok(HttpResponse::Accepted().json(serde_json::json!({
                "job_uuid": Uuid::new_v4().to_string()
            })))
        },
        "resize" => {
            // Resize VM
            Ok(HttpResponse::Accepted().json(serde_json::json!({
                "job_uuid": Uuid::new_v4().to_string()
            })))
        },
        _ => {
            Err(AppError::BadRequest(format!("Unsupported action: {}", action_req.action)))
        },
    }
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
pub struct VmJob {
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

#[get("/{uuid}/jobs")]
pub async fn get_vm_jobs(
    _user: AuthenticatedUser,
    config: Data<Config>,
    path: Path<String>,
) -> Result<HttpResponse, AppError> {
    let uuid = path.into_inner();
    
    // Create an instance of the VMAPI service
    info!("Getting jobs for VM {} using VMAPI service", uuid);
    let vmapi_service = VmapiService::new(config.vmapi_url.clone());
    
    // Call the service to get the VM jobs
    let jobs = vmapi_service.get_vm_jobs(&uuid).await?;
    
    // Return the jobs as JSON
    Ok(HttpResponse::Ok().json(jobs))
}