require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/db");

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    await testConnection();
    console.log("Database connection successful.");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
