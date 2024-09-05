mod api;
mod payload;
mod recompiler;

use std::time::Duration;

use anyhow::Result;
use axum::Router;
use clap::Parser;
use futures::{future::OptionFuture, FutureExt};
use recompiler::Recompiler;
use tokio::{net::TcpListener, signal, time};
use tower::util;
use tower_http::{services::ServeDir, trace::TraceLayer};
use tracing::info;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, Registry};

const ADDR: &str = "localhost:3000";
const MOD_TIMES: &str = "modtimes.json";
const DIST_DIR: &str = "../dist";
const CLIENT_DIR: &str = "../client";
const SRC_DIR: &str = "../client/src";
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

    let routes = Router::new()
        .nest_service("/", ServeDir::new(DIST_DIR))
        .layer(util::option_layer(
            OptionFuture::from(recompiler).await.transpose()?,
        ))
        .nest("/api", api::routes()?.layer(TraceLayer::new_for_http()));

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
