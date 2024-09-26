use anyhow::Result;
use axum::{
    body::Bytes,
    extract::{FromRequest, Request},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::{de::DeserializeOwned, Serialize};
use std::{future::Future, pin::Pin};

pub struct Payload<T>(pub T);

impl<T: DeserializeOwned, S: Send + Sync> FromRequest<S> for Payload<T> {
    type Rejection = (StatusCode, String);

    fn from_request<'s, 'fut>(
        req: Request,
        state: &'s S,
    ) -> Pin<Box<dyn Future<Output = Result<Self, Self::Rejection>> + Send + 'fut>>
    where
        's: 'fut,
        Self: 'fut,
    {
        Box::pin(async {
            let bytes = Bytes::from_request(req, state)
                .await
                .map_err(|_| (StatusCode::BAD_REQUEST, "No data received".into()))?;

            serde_json::from_slice(&bytes).map(Self).map_err(|err| {
                let err = err.to_string();
                let err = err
                    .split_once("at line")
                    .map(|(err, _)| err)
                    .unwrap_or(&err);

                (StatusCode::BAD_REQUEST, err.into())
            })
        })
    }
}

impl<T: Serialize> IntoResponse for Payload<T> {
    fn into_response(self) -> Response {
        Json(self.0).into_response()
    }
}
