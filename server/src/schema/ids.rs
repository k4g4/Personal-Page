use core::str;
use rand::{distributions::Alphanumeric, prelude::*};
use serde::{de, ser, Deserialize, Deserializer, Serialize, Serializer};
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::sqlite::SqliteArgumentValue;
use sqlx::{Database, Decode, Encode, Sqlite, Type};
use std::array;
use std::fmt::{self, Display, Formatter};

#[derive(Copy, Clone, Debug)]
pub struct Id([u8; 16]);

impl Default for Id {
    fn default() -> Self {
        let rng = &mut rand::thread_rng();
        Self(array::from_fn(|_| Alphanumeric.sample(rng)))
    }
}

impl Display for Id {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.write_str(str::from_utf8(&self.0).map_err(|_| fmt::Error)?)
    }
}

impl Serialize for Id {
    fn serialize<S: Serializer>(&self, ser: S) -> Result<S::Ok, S::Error> {
        ser.serialize_str(
            str::from_utf8(&self.0).map_err(|_| <S::Error as ser::Error>::custom("invalid id"))?,
        )
    }
}

impl Type<Sqlite> for Id {
    fn type_info() -> <Sqlite as Database>::TypeInfo {
        <&str as Type<Sqlite>>::type_info()
    }
}

impl<'r> Decode<'r, Sqlite> for Id {
    fn decode(value: <Sqlite as Database>::ValueRef<'r>) -> Result<Self, BoxDynError> {
        <&str as Decode<Sqlite>>::decode(value)?
            .as_bytes()
            .try_into()
            .map_err(|_| "Invalid id length".into())
            .map(Self)
    }
}

impl<'q> Encode<'q, Sqlite> for Id {
    fn encode_by_ref(
        &self,
        buf: &mut <Sqlite as Database>::ArgumentBuffer<'q>,
    ) -> Result<IsNull, BoxDynError> {
        buf.push(SqliteArgumentValue::Text(
            std::str::from_utf8(&self.0)?.to_owned().into(),
        ));

        Ok(IsNull::No)
    }
}

impl<'de> Deserialize<'de> for Id {
    fn deserialize<D: Deserializer<'de>>(deser: D) -> Result<Self, D::Error> {
        <&str>::deserialize(deser)?
            .as_bytes()
            .try_into()
            .map(Self)
            .map_err(|_| <D::Error as de::Error>::custom("invalid id"))
    }
}

macro_rules! id_type {
    ($name:ident) => {
        #[derive(Copy, Clone, Type, Serialize, Deserialize, Default, Debug)]
        #[sqlx(transparent)]
        pub struct $name(pub Id);

        impl Display for $name {
            fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", self.0)
            }
        }
    };
}

id_type!(UserId);
id_type!(CardId);
