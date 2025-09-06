import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
    redisClient = createClient({
        url: process.env.REDIS_URL,
    });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.connect();
}

export default redisClient;
