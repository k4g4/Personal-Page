use crate::models::ids::UserId;
use jsonwebtoken::DecodingKey;
use serde::Deserialize;
use std::str::FromStr;

#[derive(Deserialize)]
pub struct Claim {
    pub sub: UserId,
}

impl FromStr for Claim {
    type Err = jsonwebtoken::errors::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        jsonwebtoken::decode(s, &DecodingKey::from_secret(b"foobar"), &Default::default())
            .map(|token| token.claims)
    }
}
