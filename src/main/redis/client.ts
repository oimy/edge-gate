import {createClient, RedisClientType} from "redis";

const url = process.env.REDIS_URL || "";
if (!url) throw new Error('Redis URL is required');

const redisClient: RedisClientType = createClient({url});
export default redisClient;