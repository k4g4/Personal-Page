use std::time::Duration;

use crate::{extractors::user::User, jwt::Claim, models::ids::UserId};
use axum::{http::StatusCode, Json, Router};
use serde::{Deserialize, Serialize};
use tokio::time;

type Result<T> = axum::response::Result<Json<T>>;

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

schema! {
    struct Credentials {
        username: String,
        password: String,
    }

    struct Token {
        token: String,
    }
}

routes! {
    post login(Json(Credentials { username, password }): Json<Credentials>) -> Result<Token> {
        let id = UserId::default();

        println!("login: {username} {password}");
        time::sleep(Duration::from_secs(1)).await;

        Claim::new(id)
            .encode()
            .map(|token| Json(Token { token }))
            .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create token").into())
    }

    post signup(Json(Credentials { username, password }): Json<Credentials>) -> Result<Token> {
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
