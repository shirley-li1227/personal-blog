const { dbGet, dbRun } = require("../config/db");

async function findUserByUsername(username) {
  return dbGet(
    "SELECT id, username, email, password, avatar, created_at FROM users WHERE username = ? LIMIT 1",
    [username]
  );
}

async function findUserByEmail(email) {
  return dbGet(
    "SELECT id, username, email, password, avatar, created_at FROM users WHERE email = ? LIMIT 1",
    [email]
  );
}

async function createUser({ username, email, hashedPassword }) {
  const result = await dbRun(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashedPassword]
  );

  return result.insertId;
}

async function findUserById(id) {
  return dbGet(
    "SELECT id, username, email, avatar, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
}

module.exports = {
  findUserByUsername,
  findUserByEmail,
  createUser,
  findUserById,
};
