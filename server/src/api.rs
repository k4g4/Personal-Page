use axum::{
    extract::{Query, Request},
    http::Method,
    Json, Router,
};
use serde::{Deserialize, Serialize};

const GET: Method = Method::GET;
const POST: Method = Method::POST;
const DELETE: Method = Method::DELETE;

macro_rules! schema {
    ($( $name:item )*) => {
        $(
            #[derive(Clone, Deserialize, Serialize, Debug)]
            #[serde(rename_all = "camelCase")]
            $name
        )*
    }
}

macro_rules! routes {
    ($($method:ident $endpoint:ident$args:tt -> $resty:ty $res:block)*) => {
        pub fn routes() -> Router {
            Router::new()
            $(
                .route(
                    concat!("/", stringify!($endpoint)),
                    axum::routing::$method({
                        async fn $endpoint$args -> $resty $res
                        $endpoint
                    }),
                )
            )*
        }
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

routes! {
    get foo(foo: Query<Foo>, _bar: Request) -> Json<Bar> {
        println!("{foo:?}");
        foo.bars[0].clone().into()
    }

    get bar(bar: Json<Bar>) -> Json<Bar> {
        bar
    }

    post bar(bar: Json<Bar>) -> Json<Bar> {
        bar
    }

    post foo(bar: Json<Bar>) -> Json<Foo> {
        Json(Foo { bars: vec![bar.0], hello: true })
    }
}
