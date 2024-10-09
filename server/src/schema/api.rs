use serde::{de::Error, Deserialize, Deserializer, Serialize};

macro_rules! schema {
    ($( $name:item )*) => {
        $(
            #[derive(Clone, Serialize, Deserialize, Debug)]
            #[serde(rename_all = "camelCase")]
            $name
        )*
    }
}

fn username<'de, D: Deserializer<'de>>(deser: D) -> Result<String, D::Error> {
    let username = <&str>::deserialize(deser)?;

    if (4..=16).contains(&username.len())
        && username
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_')
    {
        Ok(username.into())
    } else {
        Err(D::Error::custom("Invalid username"))
    }
}

fn password<'de, D: Deserializer<'de>>(deser: D) -> Result<String, D::Error> {
    let password = <&str>::deserialize(deser)?;

    if (6..=16).contains(&password.len()) && !password.chars().any(char::is_whitespace) {
        Ok(password.into())
    } else {
        Err(D::Error::custom("Invalid password"))
    }
}

schema! {
    pub struct Credentials {
        #[serde(deserialize_with = "username")]
        pub username: String,
        #[serde(deserialize_with = "password")]
        pub password: String,
    }

    pub struct Token {
        pub token: String,
    }

    pub enum CardName {
        Calculator,
    }

    pub struct Card {
        pub name: CardName,
        pub id: i64,
    }
}
