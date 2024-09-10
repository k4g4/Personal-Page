use crate::{extractors::user::User, jwt::Claim, models::ids::UserId};
use axum::{http::StatusCode, Json, Router};
use serde::{Deserialize, Serialize};

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
    struct LoginReq {
        username: String,
        password: String,
    }

    struct LoginRes {
        token: String,
    }

    enum Bar {
        First,
        Second(u32),
        Third { thing: String },
    }

    struct Foo {
        pub bars: Vec<Bar>,
        pub hello: bool,
    }
}

routes! {
    post login(Json(login): Json<LoginReq>) -> Result<LoginRes> {
        println!("login: {login:?}");
        let id = UserId::default();
        Claim::new(id)
            .encode()
            .map(|token| Json(LoginRes { token }))
            .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "Failed to create token").into())
    }

    post logout(User(user): User) -> StatusCode {
        println!("{user} logged out");
        StatusCode::OK
    }

    post foo(User(user): User, Json(foo): Json<Foo>) -> Result<Bar> {
        println!("{user}: {foo:?}");
        Ok(foo.bars[0].clone().into())
    }
}
