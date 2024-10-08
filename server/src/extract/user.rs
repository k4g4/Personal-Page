use crate::{jwt::Claim, schema::ids::UserId};
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    RequestPartsExt,
};
use axum_extra::TypedHeader;
use headers::{authorization::Bearer, Authorization};
use std::{future::Future, pin::Pin};

pub struct User(pub UserId);

impl<S> FromRequestParts<S> for User {
    type Rejection = (StatusCode, &'static str);

    fn from_request_parts<'p, 's, 'fut>(
        parts: &'p mut Parts,
        _: &'s S,
    ) -> Pin<Box<dyn Future<Output = Result<Self, Self::Rejection>> + Send + 'fut>>
    where
        'p: 'fut,
        's: 'fut,
        Self: 'fut,
    {
        Box::pin(async {
            let TypedHeader(Authorization(bearer)) = parts
                .extract::<TypedHeader<Authorization<Bearer>>>()
                .await
                .map_err(|_| (StatusCode::UNAUTHORIZED, "No Bearer auth header"))?;
            let claim = Claim::decode(bearer.token()).map_err(|e| {
                println!("{e:?}");
                (StatusCode::UNAUTHORIZED, "Invalid auth header")
            })?;
            Ok(Self(claim.sub))
        })
    }
}
