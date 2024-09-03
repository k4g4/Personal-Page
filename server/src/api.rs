use axum::{response::IntoResponse, routing::get, Json, Router};
use serde::{Deserialize, Serialize};

use crate::payload::Payload;

macro_rules! schema {
    ($( $name:item )*) => {
        $(
            #[derive(Clone, Deserialize, Serialize, Debug)]
            #[serde(rename_all = "camelCase")]
            $name
        )*
    }
}

schema! {
    pub enum Bar {
        First,
        Second(u32),
        Third { thing: String },
    }

    pub struct Foo {
        pub bars: Vec<Bar>,
        pub hello: bool,
    }
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
