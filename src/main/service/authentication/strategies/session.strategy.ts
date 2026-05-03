import {AuthenticationStrategy} from "@/service/authentication/strategy";
import express from "express";
import redisClient from "@/redis/client";

export class SessionAuthenticationStrategy implements AuthenticationStrategy {
    async authenticate(request: express.Request): Promise<boolean> {
        const sessionKey = request.cookies["session"];
        if (!sessionKey) {
            return false;
        }

        const sessionRedisKey = `sessions:${sessionKey}`;
        return (await redisClient.get(sessionRedisKey)) !== null;
    }
}