use crate::models::ids::{CardId, UserId};

pub struct Users {
    pub id: UserId,
    #[allow(unused)]
    pub username: String,
    pub password_hash: String,
    pub password_salt_b64: String,
}

pub struct Cards {
    pub id: CardId,
    pub user_id: UserId,
    pub name: String,
    pub pos: i64,
}
