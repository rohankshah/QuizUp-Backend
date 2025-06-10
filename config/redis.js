const { createClient } = require("redis");

async function connectRedis() {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  console.log("Redis connected");

  return { pubClient, subClient };
}

module.exports = { connectRedis };
