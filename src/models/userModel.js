const { pool } = require("../config/db");

async function findUserByUsername(username) {
  const [rows] = await pool.execute(
    "SELECT id, username, email, password, avatar, created_at FROM users WHERE username = ? LIMIT 1",
    [username]
  );

  return rows[0] || null;
}

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    "SELECT id, username, email, password, avatar, created_at FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  return rows[0] || null;
}

async function createUser({ username, email, hashedPassword }) {
  const [result] = await pool.execute(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashedPassword]
  );

  return result.insertId;
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    "SELECT id, username, email, avatar, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  findUserByUsername,
  findUserByEmail,
  createUser,
  findUserById,
};
