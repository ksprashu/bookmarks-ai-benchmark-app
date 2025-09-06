import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType | null> {
  if (process.env.CACHE_ENABLED !== "true") return null;
  if (!client) {
    const url = process.env.REDIS_URL;
    if (!url) return null;
    client = createClient({ url });
    client.on("error", (err) => {
      console.error(JSON.stringify({ level: "error", op: "redis_connect", msg: String(err) }));
    });
    await client.connect();
  }
  return client;
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
