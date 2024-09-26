use crate::schema::ids::UserId;
use anyhow::Result;
use jsonwebtoken::{DecodingKey, EncodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::{env, sync::LazyLock};

static SECRET: LazyLock<Vec<u8>> = LazyLock::new(|| {
    env::var("JWT_SECRET")
        .expect("environment variable JWT_SECRET")
        .into()
});

#[derive(Serialize, Deserialize, Debug)]
pub struct Claim {
    pub sub: UserId,
}

impl Claim {
    pub fn new(id: UserId) -> Self {
        Self { sub: id }
    }

    pub fn decode(token: &str) -> Result<Self> {
        let mut validation = Validation::default();
        validation.required_spec_claims = Default::default();
        validation.validate_exp = false; // bad practice!
        let decoded = jsonwebtoken::decode(token, &DecodingKey::from_secret(&SECRET), &validation)?;
        Ok(decoded.claims)
    }

    pub fn encode(&self) -> Result<String> {
        let encoded = jsonwebtoken::encode(
            &Default::default(),
            self,
            &EncodingKey::from_secret(&SECRET),
        )?;
        Ok(encoded)
    }
}
