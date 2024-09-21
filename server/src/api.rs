use crate::{
    extractors::{payload::Payload, user::User},
    jwt::Claim,
    models::{ids::UserId, schema::UserTable},
};
use argon2::{password_hash::SaltString, Argon2, PasswordHasher};
use axum::{extract::State, http::StatusCode, Router};
use serde::{de::Error, Deserialize, Deserializer, Serialize};
use sqlx::{error::Error as SqlxError, error::ErrorKind, query_as, SqlitePool};
use tracing::debug;

type ApiResult<T> = axum::response::Result<Payload<T>>;

macro_rules! schema {
    ($( $name:item )*) => {
        $(
            #[derive(Clone, Serialize, Deserialize, Debug)]
            #[serde(rename_all = "camelCase")]
            $name
        )*
    }
}

macro_rules! routes {
    ($($method:ident $endpoint:ident$args:tt -> $ret:ty $body:block)*) => {
        pub fn routes<S>(pool: SqlitePool) -> Router<S> {
            Router::new()
            $(
                .route(
                    concat!("/", stringify!($endpoint)),
                    axum::routing::$method({
                        async fn $endpoint$args -> $ret
                        $body
                        $endpoint
                    }),
                )
            )*
                .with_state(pool)
        }
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
    struct Credentials {
        #[serde(deserialize_with = "username")]
        username: String,
        #[serde(deserialize_with = "password")]
        password: String,
    }

    struct Token {
        token: String,
    }

    enum CardName {
        Test,
        TestTwo,
    }

    struct Card {
        name: CardName,
        id: u32,
    }

    #[serde(transparent)]
    struct CardsLayout(Vec<Card>);
}

routes! {
    post login(
        State(pool): State<SqlitePool>,
        Payload(Credentials { username, password }): Payload<Credentials>,
    ) -> ApiResult<Token> {
        let generic_error = (StatusCode::INTERNAL_SERVER_ERROR, "Failed to log in");
        let invalid_login = (StatusCode::BAD_REQUEST, "Invalid username/password");

        debug!("logging in: {username} password: {password}");

        let UserTable { id, password_hash, password_salt_b64, .. } = query_as!(
            UserTable,
            r#"
            SELECT id as "id: _", username, password_hash, password_salt_b64
            FROM users WHERE username = ?
            "#,
            username,
        )
            .fetch_optional(&pool)
            .await
            .map_err(|_| generic_error)?
            .ok_or(invalid_login)?;

        let salt = SaltString::from_b64(&password_salt_b64).map_err(|_| generic_error)?;
        let hash = Argon2::default().hash_password(password.as_bytes(), &salt).map_err(|_| generic_error)?.to_string();

        if hash != password_hash {
            Err(invalid_login.into())
        } else {
            Claim::new(id)
                .encode()
                .map(|token| Payload(Token { token }))
                .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create token").into())
        }
    }

    post signup(
        State(pool): State<SqlitePool>,
        Payload(Credentials { username, password }): Payload<Credentials>,
    ) -> ApiResult<Token> {
        let generic_error = (StatusCode::INTERNAL_SERVER_ERROR, "Failed to sign up");

        debug!("signing up: {username} password: {password}");

        let salt = SaltString::generate(&mut rand::thread_rng());
        let hash = Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .map_err(|_| generic_error)?
            .to_string();

        let id = UserId::default();
        let salt = salt.as_str();
        let res = query_as!(
            UserTable,
            r#"
            INSERT INTO users (id, username, password_hash, password_salt_b64)
            VALUES (?, ?, ?, ?)
            "#,
            id,
            username,
            hash,
            salt,
        )
            .execute(&pool)
            .await
            .map_err(|err|
                match err {
                    SqlxError::Database(err) if err.kind() == ErrorKind::UniqueViolation =>
                        (StatusCode::BAD_REQUEST, "This username is taken"),
                    _ => generic_error,
                }
            )?;

        if res.rows_affected() != 1 {
            Err(generic_error.into())
        } else {
            Claim::new(id)
                .encode()
                .map(|token| Payload(Token { token }))
                .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create token").into())
        }
    }

    post logout(User(user): User) -> StatusCode {
        debug!("logging out: {user}");

        StatusCode::OK
    }

    get cards(User(user): User, State(pool): State<SqlitePool>) -> ApiResult<CardsLayout> {
        debug!("card layout: {user}");

        Ok(Payload(CardsLayout(vec![Card { name: CardName::Test, id: 0 }, Card { name: CardName::TestTwo, id: 0 }])))
    }
}
