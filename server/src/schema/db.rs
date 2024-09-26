#![allow(unused)]
use super::ids::{CardId, UserId};

pub struct User {
    pub id: UserId,
    pub username: String,
    pub password_hash: String,
    pub password_salt_b64: String,
}

pub struct Card {
    pub id: CardId,
    pub user_id: UserId,
    pub name: String,
    pub pos: i64,
}
