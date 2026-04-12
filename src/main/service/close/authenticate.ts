import express from "express";
import redisClient from "../../redis/client";

export default (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const sessionKey = request.cookies["session"];
    if (!sessionKey) throw new Error("session required");

    const sessionRedisKey = `sessions:${sessionKey}`;
    redisClient.get(sessionRedisKey)
        .then((managedSessionKey) => {
            if (!managedSessionKey) {
                response.status(403).send();
            } else {
                next();
            }
        })
        .catch((err) => {
            console.error(err);
            response.status(500).send();
        });
}