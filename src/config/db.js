const mysql = require("mysql2/promise");

let pool;

function getLocalPoolConfig() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "personal_blog",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

function getHyperdrivePoolConfig() {
  try {
    const { env } = require("cloudflare:workers");
    const h = env.HYPERDRIVE;
    if (!h || typeof h.host !== "string") {
      return null;
    }
    return {
      host: h.host,
      user: h.user,
      password: h.password,
      database: h.database,
      port: h.port,
      disableEval: true,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    };
  } catch {
    return null;
  }
}

function createPoolConfig() {
  return getHyperdrivePoolConfig() || getLocalPoolConfig();
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool(createPoolConfig());
  }
  return pool;
}

async function testConnection() {
  const connection = await getPool().getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

module.exports = {
  get pool() {
    return getPool();
  },
  testConnection,
};
