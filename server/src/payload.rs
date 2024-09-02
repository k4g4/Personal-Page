use std::{future::Future, pin::Pin};

use anyhow::Result;
use axum::{
    extract::{
        rejection::{JsonRejection, QueryRejection},
        FromRequest, Query, Request,
    },
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use futures::FutureExt;
use serde::{de::DeserializeOwned, Deserialize};
use serde_json::error::Error as SerdeJsonError;

pub struct Payload<T>(pub T);

#[derive(Deserialize)]
struct ApiQuery {
    payload: String,
}

pub enum PayloadRejection {
    Json(JsonRejection),
    Query(QueryRejection),
    QueryPayloadDeser(SerdeJsonError),
}

impl IntoResponse for PayloadRejection {
    fn into_response(self) -> Response {
        match self {
            PayloadRejection::Json(rej) => rej.into_response(),
            PayloadRejection::Query(rej) => rej.into_response(),
            PayloadRejection::QueryPayloadDeser(err) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                format!("Failed to deserialize the JSON payload: {err}"),
            )
                .into_response(),
        }
    }
}

impl<T: DeserializeOwned, S: Send + Sync> FromRequest<S> for Payload<T> {
    type Rejection = PayloadRejection;

    fn from_request<'state: 'fut, 'fut>(
        req: Request,
        state: &'state S,
    ) -> Pin<Box<dyn Future<Output = Result<Self, Self::Rejection>> + Send + 'fut>>
    where
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
            let query_future = Query::<ApiQuery>::from_request(req, state);
            Box::pin(query_future.map(|res| {
                let query = res.map_err(PayloadRejection::Query)?;
                serde_json::from_str(&query.0.payload)
                    .map(Self)
                    .map_err(PayloadRejection::QueryPayloadDeser)
            }))
        }
    }
}
