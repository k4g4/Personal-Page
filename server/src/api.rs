use crate::{extractors::user::User, jwt::Claim, models::ids::UserId};
use axum::{http::StatusCode, Json, Router};
use serde::{ser::Error, Deserialize, Serialize, Serializer};
use std::time::Duration;
use tokio::time;

type ApiResult<T> = axum::response::Result<Json<T>>;

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
        pub fn routes() -> Router {
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
        }
    }
}

fn username<S: Serializer>(username: &String, ser: S) -> Result<S::Ok, S::Error> {
    if (4..=16).contains(&username.len())
        && username
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_')
    {
        ser.serialize_str(username)
    } else {
        Err(S::Error::custom("invalid username"))
    }
}

fn password<S: Serializer>(password: &String, ser: S) -> Result<S::Ok, S::Error> {
    if (6..=16).contains(&password.len()) && !password.chars().any(char::is_whitespace) {
        ser.serialize_str(password)
    } else {
        Err(S::Error::custom("invalid password"))
    }
}

schema! {
    struct Credentials {
        #[serde(serialize_with = "username")]
        username: String,
        #[serde(serialize_with = "password")]
        password: String,
    }

    struct Token {
        token: String,
    }
}

routes! {
    post login(Json(Credentials { username, password }): Json<Credentials>) -> ApiResult<Token> {
        let id = UserId::default();

        println!("login: {username} {password}");
        time::sleep(Duration::from_secs(1)).await;

        Claim::new(id)
            .encode()
            .map(|token| Json(Token { token }))
            .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create token").into())
    }

    post signup(Json(Credentials { username, password }): Json<Credentials>) -> ApiResult<Token> {
        let id = UserId::default();

        println!("sign up: {username} {password}");
        time::sleep(Duration::from_secs(1)).await;

        Claim::new(id)
            .encode()
            .map(|token| Json(Token { token }))
            .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create token").into())
    }

    post logout(User(user): User) -> StatusCode {
        println!("{user} logged out");
        StatusCode::OK
    }
}
