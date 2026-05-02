/**
 * D1（Pages/Workers）或本地 SQLite（better-sqlite3 + LOCAL_SQLITE_PATH）
 */
function getCloudflareEnv() {
  try {
    return require("cloudflare:workers").env;
  } catch {
    return undefined;
  }
}

let localDb = null;

function getLocalDb() {
  if (localDb) {
    return localDb;
  }
  const sqlitePath = process.env.LOCAL_SQLITE_PATH;
  if (!sqlitePath) {
    return null;
  }
  const Database = require("better-sqlite3");
  localDb = new Database(sqlitePath);
  localDb.pragma("foreign_keys = ON");
  return localDb;
}

function getBinding() {
  const env = getCloudflareEnv();
  if (env?.DB) {
    return { kind: "d1", db: env.DB };
  }
  const sqlite = getLocalDb();
  if (sqlite) {
    return { kind: "sqlite", db: sqlite };
  }
  return null;
}

async function dbAll(sql, params = []) {
  const b = getBinding();
  if (!b) {
    throw new Error(
      "未配置数据库：生产环境需要 D1 绑定 DB；本地请设置环境变量 LOCAL_SQLITE_PATH 指向 SQLite 文件"
    );
  }
  if (b.kind === "d1") {
    const stmt = b.db.prepare(sql);
    const out = params.length ? await stmt.bind(...params).all() : await stmt.all();
    const rows = out.results != null ? out.results : out;
    return Array.isArray(rows) ? rows : [];
  }
  const stmt = b.db.prepare(sql);
  const rows = params.length ? stmt.all(...params) : stmt.all();
  return rows;
}

async function dbGet(sql, params = []) {
  const rows = await dbAll(sql, params);
  return rows[0];
}

async function dbRun(sql, params = []) {
  const b = getBinding();
  if (!b) {
    throw new Error(
      "未配置数据库：生产环境需要 D1 绑定 DB；本地请设置环境变量 LOCAL_SQLITE_PATH"
    );
  }
  if (b.kind === "d1") {
    const stmt = b.db.prepare(sql);
    const out = params.length ? await stmt.bind(...params).run() : await stmt.run();
    const meta = out.meta || {};
    return {
      insertId: Number(meta.last_row_id ?? 0),
      affectedRows: Number(meta.changes ?? 0),
    };
  }
  const stmt = b.db.prepare(sql);
  const info = params.length ? stmt.run(...params) : stmt.run();
  return {
    insertId: Number(info.lastInsertRowid),
    affectedRows: Number(info.changes),
  };
}

async function testConnection() {
  await dbGet("SELECT 1 AS ok");
}

module.exports = {
  dbAll,
  dbGet,
  dbRun,
  testConnection,
};
