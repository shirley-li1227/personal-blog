const { pool } = require("../config/db");

async function findCategoryByName(name) {
  const [rows] = await pool.execute(
    "SELECT id, name, description FROM categories WHERE name = ? LIMIT 1",
    [name]
  );
  return rows[0] || null;
}

async function createCategory(name) {
  const [result] = await pool.execute(
    "INSERT INTO categories (name, description) VALUES (?, ?)",
    [name, null]
  );
  return result.insertId;
}

async function ensureCategoryByName(name) {
  const existing = await findCategoryByName(name);
  if (existing) {
    return existing.id;
  }

  const insertId = await createCategory(name);
  return insertId;
}

module.exports = {
  findCategoryByName,
  ensureCategoryByName,
};
