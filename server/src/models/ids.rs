use rand::{distributions::Alphanumeric, prelude::*};
use serde::{de::Error, Deserialize, Deserializer};
use std::array;

#[derive(Copy, Clone, Debug)]
pub struct Id([u8; 16]);

impl Id {
    pub fn new() -> Self {
        let rng = &mut rand::thread_rng();
        Self(array::from_fn(|_| Alphanumeric.sample(rng)))
    }
}

impl<'de> Deserialize<'de> for Id {
    fn deserialize<D: Deserializer<'de>>(deser: D) -> Result<Self, D::Error> {
        <&str>::deserialize(deser)?
            .as_bytes()
            .try_into()
            .map(Self)
            .map_err(|_| D::Error::custom("invalid id"))
    }
}

macro_rules! id_type {
    ($name:ident) => {
        #[derive(Copy, Clone, Deserialize, Debug)]
        pub struct $name(pub Id);

        impl $name {
            pub fn new() -> Self {
                Self(Id::new())
            }
        }
    };
}

id_type!(UserId);
