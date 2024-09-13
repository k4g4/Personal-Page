use crate::models::ids::UserId;

pub struct UserTable {
    pub id: UserId,
    pub username: String,
    pub password_hash: String,
    pub password_salt_b64: String,
}
