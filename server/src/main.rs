mod api;
mod extractors;
mod jwt;
mod models;
mod recompiler;

use anyhow::Result;
use axum::Router;
use axum_extra::middleware;
use clap::Parser;
use futures::{future::OptionFuture, FutureExt};
use recompiler::Recompiler;
use sqlx::{migrate, SqlitePool};
use std::{env, time::Duration};
use tokio::{net::TcpListener, signal, time};
use tower_http::{
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::info;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, Registry};

const ADDR: &str = "0.0.0.0:3000";
const MOD_TIMES: &str = "modtimes.json";
const DIST_DIR: &str = "../dist";
const INDEX_PATH: &str = "../dist/index.html";
const CLIENT_DIR: &str = "../client";
const INPUT_CSS: &str = "input.css";
const INDEX_CSS: &str = "index.css";

/// A personal webpage for practicing web development
#[derive(clap::Parser)]
struct Args {
    /// Enable dev mode
    #[arg(long)]
    dev: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let Args { dev } = Args::parse();
    let recompiler = dev.then(Recompiler::load);

    dotenvy::dotenv()?;

    let pool = SqlitePool::connect(&env::var("DATABASE_URL")?).await?;

    migrate!().run(&pool).await?;

    let routes = Router::new()
        .nest_service(
            "/",
            ServeDir::new(DIST_DIR).fallback(ServeFile::new(INDEX_PATH)),
        )
        .layer(middleware::option_layer(
            OptionFuture::from(recompiler).await.transpose()?,
        ))
        .nest("/api", api::routes(pool).layer(TraceLayer::new_for_http()));

    Registry::default().with(fmt::layer()).init();
    info!(
        "running server in {} mode on {ADDR}",
        if dev { "dev" } else { "production" }
    );

    axum::serve(TcpListener::bind(ADDR).await?, routes)
        .with_graceful_shutdown(signal::ctrl_c().map(|_| ()))
        .await?;
    time::sleep(Duration::from_millis(50)).await;

    Ok(())
}
