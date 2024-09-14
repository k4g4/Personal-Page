mod api;
mod extractors;
mod jwt;
mod models;
mod recompiler;

use anyhow::Result;
use axum::Router;
use clap::Parser;
use recompiler::Recompiler;
use sqlx::{migrate, SqlitePool};
use std::env;
use tokio::{net::TcpListener, signal};
use tower_http::{
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::info;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, Registry};

const ADDR: &str = "0.0.0.0:3000";
const DIST_DIR: &str = "../dist";
const INDEX_PATH: &str = "../dist/index.html";

/// A personal webpage for practicing web development
#[derive(clap::Parser)]
struct Args {
    /// Enable watch mode
    #[arg(long)]
    watch: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let Args { watch } = Args::parse();
    let _recompiler = watch.then(Recompiler::start).transpose()?;

    dotenvy::dotenv()?;

    let pool = SqlitePool::connect(&env::var("DATABASE_URL")?).await?;

    migrate!().run(&pool).await?;

    let routes = Router::new()
        .nest_service(
            "/",
            ServeDir::new(DIST_DIR).fallback(ServeFile::new(INDEX_PATH)),
        )
        .nest("/api", api::routes(pool).layer(TraceLayer::new_for_http()));

    Registry::default().with(fmt::layer()).init();
    info!("running server on {ADDR}",);

    axum::serve(TcpListener::bind(ADDR).await?, routes)
        .with_graceful_shutdown(async {
            signal::ctrl_c().await.expect("failed to listen for ctrl-c");
        })
        .await?;

    Ok(())
}
