import { Redis } from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

let commandClient = null;
let publisherClient = null;
let subscriberClient = null;

function createClient(name) {
  const client = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
  });

  client.on("connect", () => {
    logger.info(`Redis ${name} connected`);
  });

  client.on("error", (error) => {
    logger.warn(`Redis ${name} error: ${error.message}`);
  });

  return client;
}

export function isRedisEnabled() {
  return Boolean(env.redisUrl);
}

export function getRedisClient() {
  if (!isRedisEnabled()) return null;
  if (!commandClient) {
    commandClient = createClient("command");
  }
  return commandClient;
}

export function getRedisPublisher() {
  if (!isRedisEnabled()) return null;
  if (!publisherClient) {
    publisherClient = createClient("publisher");
  }
  return publisherClient;
}

export function getRedisSubscriber() {
  if (!isRedisEnabled()) return null;
  if (!subscriberClient) {
    subscriberClient = createClient("subscriber");
  }
  return subscriberClient;
}
