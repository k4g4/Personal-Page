use axum::{response::IntoResponse, routing::get, Json, Router};
use serde::{Deserialize, Serialize};

use crate::payload::Payload;

#[derive(Clone, Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub enum Bar {
    First,
    Second(u32),
    Third { thing: String },
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Foo {
    pub bars: Vec<Bar>,
    pub hello: bool,
}

pub fn routes() -> Router {
    Router::new()
        .route("/foo", get(get_foo))
        .route("/baz", get(|| async { "hello world" }))
}

async fn get_foo(Payload(foo): Payload<Foo>) -> impl IntoResponse {
    println!("{foo:?}");
    Json(foo.bars[0].clone())
}
