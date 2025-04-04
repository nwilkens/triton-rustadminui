use actix_cors::Cors;
use actix_web::{middleware, web, App, HttpResponse, HttpServer};
use dotenv::dotenv;
use rust_embed::RustEmbed;
use std::env;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod api;
mod auth;
mod config;
mod error;
mod models;
mod services;

// Embed the static directory into the binary
#[derive(RustEmbed)]
#[folder = "static/"]
struct StaticAssets;

// Serve index.html for the root path
async fn serve_index() -> HttpResponse {
    match StaticAssets::get("index.html") {
        Some(content) => HttpResponse::Ok()
            .content_type("text/html")
            .body(content.data.into_owned()),
        None => HttpResponse::NotFound().body("404 Not Found - Index not found")
    }
}

// Handle static file requests
async fn serve_static_file(path: web::Path<String>) -> HttpResponse {
    let path = path.into_inner();
    
    match StaticAssets::get(&path) {
        Some(content) => {
            let mime = mime_guess::from_path(&path).first_or_octet_stream();
            HttpResponse::Ok()
                .content_type(mime.as_ref())
                .body(content.data.into_owned())
        },
        None => {
            // If the path doesn't exist, serve index.html for SPA routing
            match StaticAssets::get("index.html") {
                Some(content) => HttpResponse::Ok()
                    .content_type("text/html")
                    .body(content.data.into_owned()),
                None => HttpResponse::NotFound().body("404 Not Found")
            }
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Parse command line arguments
    let args: Vec<String> = env::args().collect();
    let mut config_file_path = None;
    
    // Handle command line arguments manually
    for i in 1..args.len() {
        if args[i] == "--config" || args[i] == "-c" {
            if i + 1 < args.len() {
                config_file_path = Some(args[i + 1].clone());
            }
        }
    }
    
    // Load environment variables from .env file if present
    dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting Triton Admin UI server");
    
    // Check if build-info.json exists and log its contents
    if let Some(build_info) = StaticAssets::get("build-info.json") {
        match std::str::from_utf8(&build_info.data) {
            Ok(info_str) => {
                info!("Frontend build information: {}", info_str);
            },
            Err(_) => {
                info!("Frontend build information file exists but could not be read");
            }
        }
    } else {
        info!("No frontend build information found. Run the deploy.sh script in the frontend directory to update the frontend build.");
    }

    // Load configuration
    let config = if let Some(path) = config_file_path {
        info!("Loading configuration from file: {}", path);
        match config::Config::from_file(&path) {
            Ok(config) => config,
            Err(e) => {
                eprintln!("Failed to load configuration from file {}: {}", path, e);
                std::process::exit(1);
            }
        }
    } else {
        info!("Loading configuration from environment variables");
        match config::Config::from_env() {
            Ok(config) => config,
            Err(e) => {
                eprintln!("Failed to load configuration from environment: {}", e);
                eprintln!("Make sure all required environment variables are set in the .env file");
                std::process::exit(1);
            }
        }
    };
    
    let app_config = web::Data::new(config.clone());
    
    // Database connection pool will be initialized here
    // let db_pool = db::create_pool(&config.database_url).await?;

    // Start HTTP server
    HttpServer::new(move || {
        // Configure CORS
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(middleware::Logger::default())
            .wrap(middleware::Compress::default())
            .wrap(cors)
            // Add application state
            // .app_data(web::Data::new(db_pool.clone()))
            .app_data(app_config.clone())
            // API routes with JWT authentication
            .configure(|cfg| api::configure_routes(cfg, &config.jwt_secret))
            // Static files (for SPA frontend) - embedded in the binary
            .route("/", web::get().to(serve_index))
            .route("/{path:.*}", web::get().to(serve_static_file))
    })
    .bind(format!("{0}:{1}", &config.host, config.port))?
    .run()
    .await
}