require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function initDatabase() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "personal_blog";

  const sqlPath = path.join(__dirname, "..", "sql", "init.sql");
  let sqlContent = fs.readFileSync(sqlPath, "utf-8");

  // Keep SQL file reusable while allowing DB name from environment.
  sqlContent = sqlContent.replace(/`personal_blog`/g, `\`${database}\``);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    await connection.query(sqlContent);
    console.log(`Database initialized successfully: ${database}`);
  } finally {
    await connection.end();
  }
}

initDatabase().catch((error) => {
  console.error("Database initialization failed:", error.message);
  process.exit(1);
});
