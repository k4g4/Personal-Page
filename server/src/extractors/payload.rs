use anyhow::Result;
use axum::{
    extract::{
        rejection::{JsonRejection, QueryRejection},
        FromRequest, Query, Request,
    },
    http::Method,
    response::{IntoResponse, Response},
    Json,
};
use futures::FutureExt;
use serde::de::DeserializeOwned;
use std::{future::Future, pin::Pin};

pub struct Payload<T>(pub T);

pub enum PayloadRejection {
    Json(JsonRejection),
    Query(QueryRejection),
}

impl IntoResponse for PayloadRejection {
    fn into_response(self) -> Response {
        match self {
            PayloadRejection::Json(rej) => rej.into_response(),
            PayloadRejection::Query(rej) => rej.into_response(),
        }
    }
}

impl<T: DeserializeOwned, S: Send + Sync> FromRequest<S> for Payload<T> {
    type Rejection = PayloadRejection;

    fn from_request<'s, 'fut>(
        req: Request,
        state: &'s S,
    ) -> Pin<Box<dyn Future<Output = Result<Self, Self::Rejection>> + Send + 'fut>>
    where
        's: 'fut,
        Self: 'fut,
    {
        if req.method() == Method::POST {
            let json_future = Json::<T>::from_request(req, state);
            Box::pin(json_future.map(|res| {
                res.map(|json| json.0)
                    .map(Self)
                    .map_err(PayloadRejection::Json)
            }))
        } else {
            let query_future = Query::from_request(req, state);
            Box::pin(query_future.map(|res| {
                res.map(|query| query.0)
                    .map(Self)
                    .map_err(PayloadRejection::Query)
            }))
        }
    }
}
