use axum::{Json, Router};
use serde::{Deserialize, Serialize};

type Result<T> = axum::response::Result<Json<T>>;

macro_rules! schema {
    ($( $name:item )*) => {
        $(
            #[derive(Clone, Serialize, Deserialize, Debug)]
            #[serde(rename_all = "camelCase")]
            $name
        )*
    }
}

macro_rules! routes {
    ($($method:ident $endpoint:ident$args:tt -> $ret:ty $body:block)*) => {
        pub fn routes() -> Router {
            Router::new()
            $(
                .route(
                    concat!("/", stringify!($endpoint)),
                    axum::routing::$method({
                        async fn $endpoint$args -> $ret
                        $body
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
    get foo(Json(foo): Json<Foo>) -> Result<Bar> {
        println!("{foo:?}");
        Ok(foo.bars[0].clone().into())
    }

    get bar(bar: Json<Bar>) -> Result<Bar> {
        Ok(bar)
    }

    post bar(bar: Json<Bar>) -> Result<Bar> {
        Ok(bar)
    }

    post foo(bar: Json<Bar>) -> Result<Foo> {
        Ok(Json(Foo { bars: vec![bar.0], hello: true }))
    }
}
