import { createClient } from "redis";

// Create Redis client with connection URL from environment
export const redis = createClient({ 
  url: process.env.REDIS_URL || "redis://localhost:6379" 
});

// Handle Redis connection errors
redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("ready", () => {
  console.log("Redis ready to accept commands");
});

redis.on("end", () => {
  console.log("Redis connection closed");
});

// Connect to Redis (this is async)
let isConnecting = false;

export async function connectRedis() {
  if (redis.isOpen) {
    return redis;
  }
  
  if (isConnecting) {
    return redis;
  }
  
  isConnecting = true;
  
  try {
    await redis.connect();
    isConnecting = false;
    return redis;
  } catch (error) {
    isConnecting = false;
    console.error("Failed to connect to Redis:", error);
    throw error;
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  try {
    if (redis.isOpen) {
      await redis.quit();
    }
  } catch (error) {
    console.error("Error closing Redis connection:", error);
  }
});

process.on("SIGINT", async () => {
  try {
    if (redis.isOpen) {
      await redis.quit();
    }
  } catch (error) {
    console.error("Error closing Redis connection:", error);
  }
});

export default redis;