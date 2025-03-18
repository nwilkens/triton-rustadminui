use serde::{Deserialize, Serialize};
use uuid::Uuid;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;
use tracing::{info, warn, error};
use ldap3::{LdapConn, Scope, SearchEntry, LdapError, LdapConnSettings};
use native_tls::{TlsConnector, Certificate};

use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UfdsUser {
    pub uuid: String,
    pub login: String,
    pub email: String,
    pub name: String,
    pub is_admin: bool,
    pub roles: Vec<String>,
}

pub struct UfdsService {
    client: reqwest::Client,
    ldaps_url: String,
    api_url: String,
    // LDAP configuration
    ldap_base_dn: String,
    ldap_user_dn_format: String,
    ldap_use_tls: bool,
    ldap_verify_certs: bool,  // Whether to verify TLS certificates
    // Cache for user data (UUID -> UserData)
    cache: Arc<Mutex<HashMap<String, UfdsUser>>>,
}

impl UfdsService {
    // Helper method to authenticate via LDAP/LDAPS
    fn authenticate_ldap(&self, username: &str, password: &str) -> Result<UfdsUser, AppError> {
        // Format the LDAP URL properly for connecting
        let ldap_url = if self.ldaps_url.contains("://") {
            self.ldaps_url.clone()
        } else {
            format!("ldap://{}", self.ldaps_url)
        };
        
        info!("Connecting to LDAP server: {}", ldap_url);
        
        // Create custom TLS settings when using LDAPS
        let mut ldap = if ldap_url.starts_with("ldaps://") {
            // Configure TLS for LDAPS connection
            info!("Using LDAPS connection with certificate verification: {}", self.ldap_verify_certs);
            
            // Create a TLS connector with certificate verification options
            let tls_builder = TlsConnector::builder()
                .danger_accept_invalid_certs(!self.ldap_verify_certs)  // Disable cert verification if specified
                .build()
                .map_err(|e| {
                    error!("Failed to build TLS connector: {}", e);
                    AppError::AuthError(format!("TLS configuration error: {}", e))
                })?;
                
            // Create LDAP connection settings with our TLS connector
            let ldap_settings = LdapConnSettings::new()
                .set_connector(tls_builder.into());
                
            // Create the connection with custom settings
            match LdapConn::with_settings(ldap_settings, &ldap_url) {
                Ok(conn) => conn,
                Err(e) => {
                    error!("Failed to connect to LDAPS server: {}", e);
                    return Err(AppError::AuthError(format!("Cannot connect to LDAPS server: {}", e)));
                }
            }
        } else {
            // For regular LDAP (non-SSL), use the standard connection
            match LdapConn::new(&ldap_url) {
                Ok(conn) => conn,
                Err(e) => {
                    error!("Failed to connect to LDAP server: {}", e);
                    return Err(AppError::AuthError(format!("Cannot connect to LDAP server: {}", e)));
                }
            }
        };
        
        // Note: ldap3 crate's LdapConn doesn't have start_tls() method; 
        // LDAPS connections are automatically secured when using ldaps:// URLs
        
        // Create the user DN from the username
        let user_dn = self.ldap_user_dn_format.replace("{}", username);
        
        info!("Binding with user DN: {}", user_dn);
        
        // Attempt to bind with the user credentials
        if let Err(e) = ldap.simple_bind(&user_dn, password) {
            error!("LDAP authentication failed: {}", e);
            return Err(AppError::AuthError(format!("Authentication failed: {}", e)));
        }
        
        info!("LDAP authentication succeeded for user: {}", username);
        
        // Search for the user attributes
        let search_base = self.ldap_base_dn.clone();
        let search_filter = format!("(&(objectClass=sdcPerson)(cn={}))", username);
        let attrs = vec!["uuid", "email", "cn", "sn", "givenName", "memberof", "isAdmin"];
        
        info!("Searching for user attributes: base={}, filter={}", search_base, search_filter);
        
        let search_result = match ldap.search(&search_base, Scope::Subtree, &search_filter, attrs) {
            Ok(result) => result,
            Err(e) => {
                error!("LDAP search failed: {}", e);
                return Err(AppError::AuthError(format!("Failed to retrieve user information: {}", e)));
            }
        };
        
        // Process the search results - SearchResult.0 contains the Vec<ResultEntry>
        let result_entries = search_result.0;
        if result_entries.is_empty() {
            error!("No user entries found for {}", username);
            return Err(AppError::AuthError(format!("User {} not found in directory", username)));
        }
        
        // Use the first entry - SearchEntry::construct returns a SearchEntry directly, not a Result
        let entry = SearchEntry::construct(result_entries[0].clone());
        
        // Extract user attributes
        let user_uuid = entry.attrs.get("uuid")
            .and_then(|attr| attr.first())
            .unwrap_or(&"unknown".to_string())
            .to_string();
            
        // Get name - use givenName + sn if available, otherwise use cn
        let first_name = entry.attrs.get("givenName")
            .and_then(|attr| attr.first())
            .unwrap_or(&"".to_string())
            .to_string();
            
        let last_name = entry.attrs.get("sn")
            .and_then(|attr| attr.first())
            .unwrap_or(&"".to_string())
            .to_string();
            
        let name = if !first_name.is_empty() || !last_name.is_empty() {
            format!("{} {}", first_name, last_name).trim().to_string()
        } else {
            entry.attrs.get("cn")
                .and_then(|attr| attr.first())
                .unwrap_or(&username.to_string())
                .to_string()
        };
        
        let email = entry.attrs.get("email")
            .and_then(|attr| attr.first())
            .unwrap_or(&format!("{}@example.com", username))
            .to_string();
            
        // Extract roles from memberof attribute
        let mut roles = Vec::new();
        if let Some(member_of) = entry.attrs.get("memberof") {
            for group_dn in member_of {
                // Parse role from group DN
                // Typical format: cn=role-name,ou=groups,o=smartdc
                if group_dn.contains("cn=") {
                    let role = group_dn
                        .split("cn=").nth(1)
                        .and_then(|s| s.split(',').next())
                        .unwrap_or("unknown");
                        
                    roles.push(role.to_string());
                }
            }
        }
        
        // Check for admin attribute
        let is_admin = entry.attrs.get("isAdmin")
            .and_then(|attr| attr.first())
            .map(|v| v == "true")
            .unwrap_or(false);
            
        if is_admin && !roles.contains(&"admin".to_string()) {
            roles.push("admin".to_string());
        }
        
        // Create user object
        let user = UfdsUser {
            uuid: user_uuid,
            login: username.to_string(),
            email,
            name,
            is_admin,
            roles,
        };
        
        Ok(user)
    }
    
    pub fn new(base_url: String) -> Self {
        // Determine if we're using LDAPS or HTTP
        let is_ldaps = base_url.starts_with("ldaps://");
        let is_ldap = base_url.starts_with("ldap://");
        
        // Get certificate verification setting from env, default to true in production
        let verify_certs = std::env::var("LDAP_VERIFY_CERTIFICATES")
            .map(|v| v.to_lowercase() != "false")
            .unwrap_or(true);
            
        info!("LDAP certificate verification: {}", verify_certs);
        
        let (api_url, ldaps_url, ldap_use_tls, ldap_base_dn, ldap_user_dn_format) = if is_ldaps || is_ldap {
            // Handle LDAP/LDAPS URL
            let protocol = if is_ldaps { "ldaps://" } else { "ldap://" };
            // Split to get host:port, fixing ownership issues
            let without_protocol = base_url.replace(protocol, "");
            let host_parts: Vec<&str> = without_protocol.split('/').collect();
            let host_with_port = host_parts.first().unwrap_or(&"localhost:389").to_string();
            
            // Split host and port if present - fix ownership issue
            let host_parts: Vec<&str> = host_with_port.split(':').collect();
            let host = host_parts.first().unwrap_or(&"localhost");
            
            // Extract base DN from the URL if present or use a default
            let parts: Vec<&str> = base_url.split('/').collect();
            let base_dn = if parts.len() > 3 {
                parts[3..].join("/")
            } else {
                "o=smartdc".to_string() // Default Triton base DN
            };
            
            // Create user DN format
            let user_dn_format = format!("cn={},ou=users,{}", "{}", base_dn);
            
            // For API fallback (mock server)
            let api_url = format!("http://{}:3000", host);
            
            info!("Configured for LDAP/LDAPS authentication: URL={}, Base DN={}, User DN Format={}", 
                  base_url, base_dn, user_dn_format);
            
            (api_url, base_url, is_ldaps, base_dn, user_dn_format)
        } else {
            // HTTP URL for mock server or API
            let url_without_protocol = base_url.replace("http://", "").replace("https://", "");
            let hostname = url_without_protocol.split('/').next().unwrap_or("localhost");
            
            // Default values for LDAP config when using HTTP API
            let ldaps = format!("ldaps://{}:636", hostname);
            let base_dn = "o=smartdc".to_string();
            let user_dn_format = format!("cn={},ou=users,{}", "{}", base_dn);
            
            info!("Configured for HTTP API authentication: URL={}", base_url);
            
            (base_url, ldaps, true, base_dn, user_dn_format)
        };
        
        Self {
            client: reqwest::Client::new(),
            ldaps_url,
            api_url,
            ldap_base_dn,
            ldap_user_dn_format,
            ldap_use_tls,
            ldap_verify_certs: verify_certs,
            cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    pub async fn authenticate(&self, username: &str, password: &str) -> Result<(String, String, String, Vec<String>), AppError> {
        // For development, still allow admin/admin
        if username == "admin" && password == "admin" {
            return Ok((
                "00000000-0000-0000-0000-000000000000".to_string(),
                "Administrator".to_string(),
                "admin@example.com".to_string(),
                vec!["admin".to_string()]
            ));
        }
        
        // For development mode, support additional test users
        if username == "operator" && password == "operator" {
            return Ok((
                "11111111-1111-1111-1111-111111111111".to_string(),
                "System Operator".to_string(),
                "operator@example.com".to_string(),
                vec!["operator".to_string()]
            ));
        }
        
        // Determine if we should use direct LDAP or API approach
        let is_ldap_url = self.ldaps_url.starts_with("ldap://") || self.ldaps_url.starts_with("ldaps://");
        
        if is_ldap_url {
            // Use native LDAP authentication
            info!("Using native LDAP authentication for {}", username);
            
            // Use blocking thread for LDAP operation since ldap3 is not async
            let ldaps_url = self.ldaps_url.clone();
            let ldap_base_dn = self.ldap_base_dn.clone();
            let ldap_user_dn_format = self.ldap_user_dn_format.clone();
            let ldap_use_tls = self.ldap_use_tls;
            
            // Clone self for use in the blocking thread
            let this = Self {
                client: self.client.clone(),
                ldaps_url,
                api_url: self.api_url.clone(),
                ldap_base_dn,
                ldap_user_dn_format,
                ldap_use_tls,
                ldap_verify_certs: self.ldap_verify_certs,
                cache: self.cache.clone(),
            };
            
            // Run LDAP authentication in a blocking thread - clone username and password to owned values
            let owned_username = username.to_string();
            let owned_password = password.to_string();
            
            let user_result = tokio::task::spawn_blocking(move || {
                this.authenticate_ldap(&owned_username, &owned_password)
            }).await.map_err(|e| {
                error!("LDAP thread error: {}", e);
                AppError::AuthError(format!("Internal error during authentication: {}", e))
            })??;
            
            // Cache the user data
            {
                let mut cache = self.cache.lock().await;
                cache.insert(user_result.uuid.clone(), user_result.clone());
            }
            
            return Ok((
                user_result.uuid,
                user_result.name,
                user_result.email,
                user_result.roles
            ));
        } else {
            // Fallback to the HTTP API method
            let auth_url = format!("{}/auth", self.api_url);
            
            info!("Using API authentication at: {}", auth_url);
            
            let auth_payload = serde_json::json!({
                "username": username,
                "password": password
            });
            
            // Try to connect to the auth endpoint
            let response = match self.client.post(&auth_url).json(&auth_payload).send().await {
                Ok(resp) => resp,
                Err(e) => {
                    // Detailed error logging
                    if e.is_connect() {
                        info!("Connection error to UFDS API: {}", e);
                        return Err(AppError::AuthError(format!("Cannot connect to authentication service. Please check network connectivity and service availability. Error: {}", e)));
                    } else if e.is_timeout() {
                        info!("Timeout connecting to UFDS API: {}", e);
                        return Err(AppError::AuthError(format!("Authentication service timeout. Please try again later. Error: {}", e)));
                    } else {
                        info!("Unknown error connecting to UFDS API: {}", e);
                        return Err(AppError::AuthError(format!("Authentication service error: {}", e)));
                    }
                }
            };
                
            if !response.status().is_success() {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
                return Err(AppError::AuthError(format!("UFDS authentication failed: {} - {}", status, error_text)));
            }
            
            // Parse the response to extract user info
            let user_data: serde_json::Value = response
                .json()
                .await
                .map_err(|e| AppError::AuthError(format!("Failed to parse UFDS response: {}", e)))?;
            
            let user_uuid = user_data["uuid"]
                .as_str()
                .ok_or_else(|| AppError::AuthError("User UUID not found in UFDS response".to_string()))?
                .to_string();
                
            let user_name = user_data["name"]
                .as_str()
                .ok_or_else(|| AppError::AuthError("User name not found in UFDS response".to_string()))?
                .to_string();
                
            let user_email = user_data["email"]
                .as_str()
                .ok_or_else(|| AppError::AuthError("User email not found in UFDS response".to_string()))?
                .to_string();
                
            // Extract roles from memberships
            let mut roles = Vec::new();
            
            if let Some(memberships) = user_data["memberships"].as_array() {
                for membership in memberships {
                    if let Some(role) = membership["role"].as_str() {
                        roles.push(role.to_string());
                    }
                }
            }
            
            // Ensure admin users have the admin role
            if user_data["isAdmin"].as_bool().unwrap_or(false) && !roles.contains(&"admin".to_string()) {
                roles.push("admin".to_string());
            }
            
            // Cache the user data
            let user = UfdsUser {
                uuid: user_uuid.clone(),
                login: username.to_string(),
                email: user_email.clone(),
                name: user_name.clone(),
                is_admin: roles.contains(&"admin".to_string()),
                roles: roles.clone(),
            };
            
            // Update the cache
            let mut cache = self.cache.lock().await;
            cache.insert(user_uuid.clone(), user);
            
            Ok((user_uuid, user_name, user_email, roles))
        }
    }
    
    pub async fn list_users(&self) -> Result<Vec<crate::api::users::User>, AppError> {
        // This is a placeholder for actual implementation
        Ok(vec![])
    }
    
    pub async fn get_user(&self, uuid: &str) -> Result<crate::api::users::User, AppError> {
        // This is a placeholder for actual implementation
        Err(AppError::NotFound(format!("User with UUID {} not found", uuid)))
    }
    
    pub async fn create_user(
        &self, 
        user: crate::api::users::CreateUserRequest
    ) -> Result<crate::api::users::User, AppError> {
        // This is a placeholder for actual implementation
        Err(AppError::InternalServerError("Not implemented".to_string()))
    }
    
    pub async fn update_user(
        &self, 
        uuid: &str, 
        user: crate::api::users::UpdateUserRequest
    ) -> Result<crate::api::users::User, AppError> {
        // This is a placeholder for actual implementation
        Err(AppError::InternalServerError("Not implemented".to_string()))
    }
    
    pub async fn delete_user(&self, uuid: &str) -> Result<(), AppError> {
        // This is a placeholder for actual implementation
        Err(AppError::InternalServerError("Not implemented".to_string()))
    }
}