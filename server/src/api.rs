use anyhow::{bail, Result};
use axum::{
    extract::{FromRequest, Query, Request},
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
    routing, Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{future::Future, pin::Pin};

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

macro_rules! apis {
    ($($method:ident $endpoint:ident($req:ident: $reqty:ty) -> $resty:ty $res:block)*) => {
        struct Api {
            method: Method,
            endpoint: &'static str,
            handler: fn(Request) -> Pin<Box<dyn Future<Output = Response> + Send>>,
        }

        #[derive(Deserialize)]
        struct ApiQuery {
            payload: String,
        }

        static APIS: [Api; {0 $(+ {let _ = $method; 1})*}] = [
            $({
                async fn $endpoint(req: Request) -> Response {
                    if req.method() != $method {
                        return (StatusCode::INTERNAL_SERVER_ERROR, "Unknown error").into_response();
                    }
                    let $req = if $method == POST {
                        match Json::<$reqty>::from_request(req, &()).await {
                            Ok(Json(req)) => req,
                            Err(reject) => return reject.into_response(),
                        }
                    } else {
                        match Query::<ApiQuery>::from_request(req, &()).await {
                            Ok(Query(ApiQuery { payload })) => {
                                match serde_json::from_str(&payload) {
                                    Ok(req) => req,
                                    Err(error) => return (
                                        StatusCode::UNPROCESSABLE_ENTITY,
                                        format!("Failed to deserialize the JSON payload: {error}"),
                                    ).into_response()
                                }
                            }
                            Err(reject) => return reject.into_response(),
                        }
                    };
                    Json::<$resty>($res).into_response()
                }
                Api {
                    method: $method,
                    endpoint: concat!("/", stringify!($endpoint)),
                    handler: |req| Box::pin(async { $endpoint(req).await }),
                }
            }),*
        ];
    };
}

apis! {
    GET foo(foo: Foo) -> Bar {
        println!("{foo:?}");
        foo.bars[0].clone()
    }

    GET bar(bar: Bar) -> Bar {
        bar
    }

    POST bar(bar: Bar) -> Bar {
        bar
    }
}

pub fn routes() -> Result<Router> {
    APIS.iter().try_fold(Router::new(), |router, api| {
        Ok(router.route(
            api.endpoint,
            if api.method == GET {
                routing::get(api.handler)
            } else if api.method == POST {
                routing::post(api.handler)
            } else if api.method == DELETE {
                routing::delete(api.handler)
            } else {
                bail!("unexpected method");
            },
        ))
    })
}
