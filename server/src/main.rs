mod api;
mod extract;
mod jwt;
mod recompiler;
mod schema;

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

const IP: &str = "0.0.0.0";
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
    dotenvy::dotenv()?;

    let Args { watch } = Args::parse();
    let _recompiler = watch.then(Recompiler::start).transpose()?;

    let pool = SqlitePool::connect(&env::var("DATABASE_URL")?).await?;
    migrate!().run(&pool).await?;

    let routes = Router::new()
        .nest_service(
            "/",
            ServeDir::new(env::var("DIST")?).fallback(ServeFile::new(INDEX_PATH)),
        )
        .nest("/api", api::routes(pool).layer(TraceLayer::new_for_http()));
    Registry::default().with(fmt::layer()).init();

    let addr = format!("{IP}:{}", env::var("PORT")?);
    info!("running server on {addr}",);

    axum::serve(TcpListener::bind(addr).await?, routes)
        .with_graceful_shutdown(async {
            signal::ctrl_c().await.expect("failed to listen for ctrl-c");
        })
        .await?;

    Ok(())
}
