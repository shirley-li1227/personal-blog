require("dotenv").config();

const fs = require("fs");
const path = require("path");

const dbPath =
  process.env.LOCAL_SQLITE_PATH || path.join(__dirname, "..", ".local.sqlite");
const migrationPath = path.join(__dirname, "..", "migrations", "0001_init.sql");

function initLocalSqlite() {
  const Database = require("better-sqlite3");
  const sql = fs.readFileSync(migrationPath, "utf-8");
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.exec(sql);
  db.close();
  console.log(`本地 SQLite 已初始化: ${dbPath}`);
}

initLocalSqlite();
