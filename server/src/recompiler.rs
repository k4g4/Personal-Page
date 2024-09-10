use anyhow::Result;
use serde_json::ser;
use std::{
    collections::HashMap,
    fs::FileType,
    future::Future,
    io::ErrorKind,
    mem,
    os::unix::fs::MetadataExt,
    path::{Path, PathBuf},
    pin::Pin,
    process::Output,
    sync::Arc,
    task::{Context, Poll},
};
use tokio::{fs, process::Command, sync::Mutex, task};
use tower::{
    layer::{self, LayerFn},
    Service,
};
use tracing::{error, info};

type ModTimes = HashMap<PathBuf, i64>;

#[derive(Clone, Default)]
pub struct Recompiler<S> {
    mod_times: Arc<Mutex<ModTimes>>,
    next_service: Arc<Mutex<S>>,
}

impl<S> Recompiler<S> {
    pub async fn load() -> Result<LayerFn<impl Fn(S) -> Self + Clone + Send>> {
        let contents = fs::read(crate::MOD_TIMES).await.or_else(|err| {
            (err.kind() == ErrorKind::NotFound)
                .then(|| b"{}".into())
                .ok_or(err)
        })?;
        let mod_times = Arc::new(Mutex::new(
            serde_json::from_slice(&contents).unwrap_or_default(),
        ));

        Ok(layer::layer_fn(move |next_service| Self {
            mod_times: mod_times.clone(),
            next_service: Arc::new(Mutex::new(next_service)),
        }))
    }
}

impl<Req, S> Service<Req> for Recompiler<S>
where
    Req: Send + 'static,
    S: Service<Req> + Send + 'static,
    S::Future: Send,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = <S::Future as Future>::Output> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        if let Ok(mut next_service) = self.next_service.try_lock() {
            next_service.poll_ready(cx)
        } else {
            Poll::Pending
        }
    }

    fn call(&mut self, req: Req) -> Self::Future {
        let mod_times = self.mod_times.clone();
        let next_service = self.next_service.clone();

        Box::pin(async move {
            match get_mod_times(crate::SRC_DIR, Default::default()).await {
                Err(error) => error!("{error}"),

                Ok(current_mod_times) => {
                    let mut mod_times = mod_times.lock().await;

                    if *mod_times != current_mod_times {
                        *mod_times = current_mod_times;
                        recompile().await;
                    }
                }
            }

            next_service.lock().await.call(req).await
        })
    }
}

impl<S> Drop for Recompiler<S> {
    fn drop(&mut self) {
        if let Some(this) = Arc::get_mut(&mut self.mod_times) {
            let inner = mem::take(this.get_mut());
            let contents = ser::to_vec_pretty(&inner).unwrap();

            task::spawn(fs::write(crate::MOD_TIMES, contents));
        }
    }
}

async fn get_mod_times(path: impl AsRef<Path>, mut mod_times: ModTimes) -> Result<ModTimes> {
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
            .current_dir(crate::CLIENT_DIR)
            .args(args)
            .env("NODE_ENV", "development")
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
    run(
        "bun",
        [
            "tailwindcss",
            "-i",
            crate::INPUT_CSS,
            "-o",
            crate::INDEX_CSS,
        ],
    )
    .await;

    info!("running vite...");
    run(
        "bun",
        [
            "vite",
            "build",
            "--outDir",
            crate::DIST_DIR,
            "--emptyOutDir",
            "--minify",
            "--mode",
            "development",
        ],
    )
    .await;
}
