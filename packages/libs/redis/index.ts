import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const redisUrl = process.env.REDIS_URL;

console.log("Redis URL configured:", redisUrl ? "Yes (rediss)" : "No");

if (!redisUrl) {
  console.error("REDIS_URL environment variable is not set");
}

// Determine if TLS is required (for Upstash, etc.)
const useTls = redisUrl?.startsWith("rediss://");

const redis = new Redis(redisUrl || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 10) {
      console.error(
        "Redis max reconnection attempts reached, stopping retries",
      );
      return null; // Stop retrying
    }
    const delay = Math.min(times * 200, 2000);
    console.log(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
  // TLS configuration for secure connections (Upstash requires this)
  ...(useTls && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
  lazyConnect: true,
  enableOfflineQueue: false, // Don't queue commands when disconnected
});

// Handle connection events
redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("ready", () => {
  console.log("Redis ready to receive commands");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redis.on("close", () => {
  console.log("Redis connection closed");
});

// Attempt initial connection
redis.connect().catch((err) => {
  console.error("Initial Redis connection failed:", err.message);
});

export default redis;
