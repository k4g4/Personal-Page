CREATE TABLE IF NOT EXISTS cards (
  id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  client_id INT NOT NULL,
  pos INT NOT NULL) STRICT;

CREATE INDEX IF NOT EXISTS cards_idx ON cards(user_id, pos);