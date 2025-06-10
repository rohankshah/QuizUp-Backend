require("dotenv").config();

const app = require("./app");
const { initializeServer } = require("./config/server");
const { connectDatabase } = require("./config/database");
const { connectRedis } = require("./config/redis");

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis
    const { pubClient, subClient } = await connectRedis();

    // Initialize server with Socket.IO
    const server = initializeServer(app, pubClient, subClient);

    server.listen(PORT, () => {
      console.log(`Server + Socket.IO running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
