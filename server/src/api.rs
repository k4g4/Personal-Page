use crate::{
    extract::{payload::Payload, user::User},
    jwt::Claim,
    schema::{
        api, db,
        ids::{CardId, UserId},
    },
};
use argon2::{password_hash::SaltString, Argon2, PasswordHasher};
use axum::{
    extract::State,
    http::StatusCode,
    response::{ErrorResponse, IntoResponse},
    Router,
};
use sqlx::{
    error::{Error as SqlxError, ErrorKind},
    query, query_as, QueryBuilder, SqlitePool,
};

trait IntoApiResult {
    type Result;
}
impl IntoApiResult for [()] {
    type Result = ();
}
impl<T: Sized> IntoApiResult for T {
    type Result = Payload<T>;
}
type ApiResult<T = [()]> = axum::response::Result<<T as IntoApiResult>::Result>;

trait MapServerError {
    type Output;
    fn map_server_err(self, error: impl IntoResponse) -> Self::Output;
}
impl<T, E> MapServerError for Result<T, E> {
    type Output = Result<T, ErrorResponse>;
    fn map_server_err(self, error: impl IntoResponse) -> Self::Output {
        self.map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, error).into())
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

routes! {
    post login(
        State(pool): State<SqlitePool>,
        Payload(api::Credentials { username, password }): Payload<api::Credentials>,
    ) -> ApiResult<api::Token> {
        let error = "Failed to log in";
        let invalid_login = (StatusCode::BAD_REQUEST, "Invalid username/password");

        let db::User { id, password_hash, password_salt_b64, .. } = query_as!(
            db::User,
            r#"
            SELECT id as "id: _", username, password_hash, password_salt_b64
            FROM users WHERE username = ?
            "#,
            username,
        )
            .fetch_optional(&pool)
            .await
            .map_server_err(error)?
            .ok_or(invalid_login)?;

        let salt = SaltString::from_b64(&password_salt_b64).map_err(|_| error)?;
        let hash = Argon2::default().hash_password(password.as_bytes(), &salt).map_err(|_| error)?.to_string();

        if hash != password_hash {
            Err(invalid_login.into())
        } else {
            Claim::new(id)
                .encode()
                .map(|token| Payload(api::Token { token }))
                .map_server_err("Failed to create token")
        }
    }

    post signup(
        State(pool): State<SqlitePool>,
        Payload(api::Credentials { username, password }): Payload<api::Credentials>,
    ) -> ApiResult<api::Token> {
        let error = "Failed to sign up";

        let salt = SaltString::generate(&mut rand::thread_rng());
        let hash = Argon2::default()
            .hash_password(password.as_bytes(), &salt)
            .map_server_err(error)?
            .to_string();

        let id = UserId::default();
        let salt = salt.as_str();
        let res = query!(
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
                    _ => (StatusCode::INTERNAL_SERVER_ERROR, error),
                }
            )?;

        if res.rows_affected() != 1 {
            Err(error.into())
        } else {
            Claim::new(id)
                .encode()
                .map(|token| Payload(api::Token { token }))
                .map_server_err("Failed to create token")
        }
    }

    post logout(User(_user): User) -> ApiResult {
        Ok(())
    }

    get cards(User(user): User, State(pool): State<SqlitePool>) -> ApiResult<Vec<api::Card>> {
        let error = "Failed to get card layout";

        let cards = query_as!(
            db::Card,
            r#"
            SELECT id as "id: _", user_id as "user_id: _", name, client_id, pos
            FROM cards
            WHERE user_id = ?
            ORDER BY pos
            "#,
            user,
        )
            .fetch_all(&pool)
            .await
            .map_server_err(error)?;

        Ok(Payload(cards.into_iter().map(|db::Card { name, client_id, .. }|
            Ok(api::Card {
                name: serde_json::from_str(&name).map_server_err(error)?,
                id: client_id,
            }),
        ).collect::<Result<Vec<_>, ErrorResponse>>()?))
    }

    post cards(
        User(user): User,
        State(pool): State<SqlitePool>,
        Payload(cards): Payload<Vec<api::Card>>,
    ) -> ApiResult {
        let error = "Failed to update card layout";

        let values = cards
            .into_iter()
            .enumerate()
            .map(|(i, api::Card { name, id })| Ok((i, serde_json::to_string(&name).map_server_err(error)?, id)))
            .collect::<Result<Vec<_>, ErrorResponse>>()?;

        query!("DELETE FROM cards WHERE user_id = ?", user).execute(&pool).await.map_server_err(error)?;

        QueryBuilder::new("INSERT INTO cards (id, user_id, name, client_id, pos)")
            .push_values(values, |mut values_builder, (pos, name, id)| {
                values_builder
                    .push_bind(CardId::default())
                    .push_bind(user)
                    .push_bind(name)
                    .push_bind(id)
                    .push_bind(pos as i64);
            })
            .build()
            .persistent(false) // don't cache dynamically sized query
            .execute(&pool)
            .await
            .map_server_err(error)?;

        Ok(())
    }
}
