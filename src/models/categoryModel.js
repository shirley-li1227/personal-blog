const { dbGet, dbRun } = require("../config/db");

async function findCategoryByName(name) {
  return dbGet("SELECT id, name, description FROM categories WHERE name = ? LIMIT 1", [name]);
}

async function createCategory(name) {
  const result = await dbRun("INSERT INTO categories (name, description) VALUES (?, ?)", [
    name,
    null,
  ]);
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
