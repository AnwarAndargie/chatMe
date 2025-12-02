import { Redis } from "@upstash/redis";

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ONLINE_USERS_KEY = "chatapp:online-users";

export async function markUserOnline(userId: string) {
    await redis.hset(ONLINE_USERS_KEY, { [userId]: Date.now() });
    await redis.expire(ONLINE_USERS_KEY, 60);
}

export async function markUserOffline(userId: string) {
    await redis.hdel(ONLINE_USERS_KEY, userId);
}

export async function getOnlineUsers(): Promise<string[]> {
    const result = await redis.hgetall<Record<string, string>>(ONLINE_USERS_KEY);
    return Object.keys(result || {});
}