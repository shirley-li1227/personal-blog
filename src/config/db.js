/**
 * Worker 绑定：D1（DB）与 Secrets（如 JWT_SECRET）通过 AsyncLocalStorage 传入 Express 子模块
 * 本地：better-sqlite3 + LOCAL_SQLITE_PATH；JWT 仍可读 process.env（.env）
 */
const { AsyncLocalStorage } = require("node:async_hooks");

const workerEnvAls = new AsyncLocalStorage();

/** 当前请求的 Worker env（含 DB、JWT_SECRET 等绑定） */
function getWorkerBindings() {
  const fromStore = workerEnvAls.getStore();
  if (fromStore && typeof fromStore === "object") {
    return fromStore;
  }
  try {
    return require("cloudflare:workers").env;
  } catch {
    return undefined;
  }
}

function runWithWorkerEnv(env, fn) {
  return workerEnvAls.run(env, fn);
}

function getJwtSecret() {
  const env = getWorkerBindings();
  if (env && typeof env.JWT_SECRET === "string" && env.JWT_SECRET.length > 0) {
    return env.JWT_SECRET;
  }
  return process.env.JWT_SECRET;
}

function getJwtExpiresIn() {
  const env = getWorkerBindings();
  if (env && typeof env.JWT_EXPIRES_IN === "string" && env.JWT_EXPIRES_IN.length > 0) {
    return env.JWT_EXPIRES_IN;
  }
  return process.env.JWT_EXPIRES_IN || "7d";
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
  const env = getWorkerBindings();
  if (env?.DB) {
    return { kind: "d1", db: env.DB };
  }
  const sqlite = getLocalDb();
  if (sqlite) {
    return { kind: "sqlite", db: sqlite };
  }
  return null;
}

function noDatabaseError() {
  return new Error(
    "未配置数据库：请在 Cloudflare 为 Worker 绑定 D1（绑定名 DB），或本地设置环境变量 LOCAL_SQLITE_PATH 指向 SQLite 文件"
  );
}

async function dbAll(sql, params = []) {
  const b = getBinding();
  if (!b) {
    throw noDatabaseError();
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
    throw noDatabaseError();
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
  runWithWorkerEnv,
  getWorkerBindings,
  getJwtSecret,
  getJwtExpiresIn,
};
