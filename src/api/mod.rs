use actix_web::web;
use crate::auth::middleware::AuthMiddleware;
use tracing::info;

pub mod auth;
pub mod vms;
pub mod users;
pub mod packages;
pub mod images;
pub mod platforms;
pub mod servers;
pub mod networks;
pub mod ping;

pub fn configure_routes(cfg: &mut web::ServiceConfig, jwt_secret: &str) {
    info!("Configuring API routes with authentication middleware");
    
    cfg.service(
        web::scope("/api")
            // Auth endpoints (no auth required)
            .service(auth::login)
            .service(auth::logout)
            .service(auth::get_current_user)
            
            // Ping endpoint (health check)
            .service(ping::ping)
            
            // Protected API routes - require authentication
            .service(
                web::scope("")
                    .wrap(AuthMiddleware::new(jwt_secret.to_string()))
                    // VMs endpoints
                    .service(
                        web::scope("/vms")
                            .service(vms::list_vms)
                            .service(vms::get_vm)
                            .service(vms::create_vm)
                            // Admin-only actions
                            .service(
                                web::scope("")
                                    .service(vms::update_vm)
                                    .service(vms::delete_vm)
                                    .service(vms::vm_action)
                            )
                    )
                    
                    // Users endpoints
                    .service(
                        web::scope("/users")
                            .service(users::list_users)
                            .service(users::get_user)
                            // Admin-only actions
                            .service(
                                web::scope("")
                                    .service(users::create_user)
                                    .service(users::update_user)
                                    .service(users::delete_user)
                            )
                    )
                    
                    // Packages endpoints
                    .service(
                        web::scope("/packages")
                            .service(packages::list_packages)
                            .service(packages::get_package)
                            // Admin-only actions
                            .service(
                                web::scope("")
                                    .service(packages::create_package)
                                    .service(packages::update_package)
                            )
                    )
                    
                    // Images endpoints
                    .service(
                        web::scope("/images")
                            .service(images::list_images)
                            .service(images::get_image)
                            // Admin-only actions
                            .service(
                                web::scope("")
                                    .service(images::update_image)
                            )
                    )
                    
                    // Platforms endpoints
                    .service(
                        web::scope("/platforms")
                            .service(platforms::list_platforms)
                    )
                    
                    // Servers endpoints
                    .service(
                        web::scope("/servers")
                            .service(servers::list_servers)
                            .service(servers::get_server)
                            // Admin-only actions
                            .service(
                                web::scope("")
                                    .service(servers::update_server)
                                    .service(servers::server_action)
                            )
                    )
                    
                    // Networks endpoints
                    .service(
                        web::scope("/networks")
                            .service(networks::list_networks)
                            .service(networks::get_network)
                            // Admin-only actions
                            .service(
                                web::scope("")
                                    .service(networks::create_network)
                                    .service(networks::update_network)
                                    .service(networks::delete_network)
                            )
                    )
            )
    );
}