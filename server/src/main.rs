mod api;

use anyhow::Result;
use api::{Bar, Foo};
use axum::{
    extract::{Request, State},
    middleware::{self, Next},
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use std::{
    collections::HashMap,
    fs::FileType,
    os::unix::fs::MetadataExt,
    path::{Path, PathBuf},
    process::Output,
    sync::Arc,
};
use tokio::{fs, net::TcpListener, process::Command, sync::Mutex};
use tower_http::services::ServeDir;
use tracing::{error, info};

const ADDR: &str = "localhost:3000";
const DIST_DIR: &str = "../dist";
const SRC_DIR: &str = "../src";
const VITE_DIR: &str = "..";

type ModTimesMap = HashMap<PathBuf, i64>;

#[derive(Clone, Default)]
struct ModTimes(Arc<Mutex<ModTimesMap>>);

#[tokio::main]
async fn main() -> Result<()> {
    let api_routes = Router::new()
        .route(
            "/foo",
            get(|| async {
                Json(Foo {
                    bars: vec![
                        Bar::First,
                        Bar::Second(42),
                        Bar::Third {
                            thing: "foo".into(),
                        },
                    ],
                    hello: true,
                })
            }),
        )
        .route("/baz", get(|| async { "hello world" }));
    let routes = Router::new()
        .nest_service("/", ServeDir::new(DIST_DIR))
        .layer(middleware::from_fn_with_state(
            ModTimes::default(),
            check_recompile,
        ))
        .nest("/api", api_routes);

    tracing_subscriber::fmt().init();
    axum::serve(TcpListener::bind(ADDR).await?, routes).await?;

    Ok(())
}

async fn check_recompile(
    State(ModTimes(mod_times)): State<ModTimes>,
    req: Request,
    next: Next,
) -> impl IntoResponse {
    match get_mod_times(SRC_DIR, Default::default()).await {
        Err(error) => error!("{error}"),

        Ok(current_mod_times) => {
            let mut mod_times = mod_times.lock().await;

            if *mod_times != current_mod_times {
                *mod_times = current_mod_times;
                recompile().await;
            }
        }
    }

    next.run(req).await
}

async fn get_mod_times(path: impl AsRef<Path>, mut mod_times: ModTimesMap) -> Result<ModTimesMap> {
    let mut dir = fs::read_dir(path).await?;

    while let Some(entry) = dir.next_entry().await? {
        let file_type = entry.file_type().await;

        if file_type.as_ref().is_ok_and(FileType::is_dir) {
            mod_times = Box::pin(get_mod_times(entry.path(), mod_times)).await?;
        } else if file_type.as_ref().is_ok_and(FileType::is_file) {
            *mod_times.entry(entry.path()).or_default() = entry.metadata().await?.mtime();
        }
    }

    Ok(mod_times)
}

async fn recompile() {
    async fn run(command: &str, args: impl IntoIterator<Item = &str>) {
        let res = Command::new(command)
            .current_dir(VITE_DIR)
            .args(args)
            .output()
            .await;

        match res {
            Err(error) => error!("{error}"),
            Ok(Output { stdout, stderr, .. }) => {
                if !stdout.is_empty() {
                    info!("{}", String::from_utf8_lossy(&stdout));
                }
                if !stderr.is_empty() {
                    error!("{}", String::from_utf8_lossy(&stderr));
                }
            }
        }
    }

    info!("running tailwind...");
    run("bun", ["tailwindcss", "-i", "input.css", "-o", "index.css"]).await;
    info!("running vite...");
    run("bun", ["vite", "build"]).await;
}
