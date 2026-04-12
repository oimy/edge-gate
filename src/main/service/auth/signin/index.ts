import express from "express";
import {throwIfNotOk} from "../../common/handlers";
import redisClient from "../../../redis/client";

export default (request: express.Request, response: express.Response) => {
    if (!request.body || !request.body.username || !request.body.password) {
        return response.status(400).send();
    }
    const createdBy = request.ip;
    if (!createdBy) return response.status(403).send();

    const username: string = request.body.username;
    const option: RequestInit = {
        method: "POST",
        body: JSON.stringify({
            username: username,
            password: request.body.password,
        }),
        headers: {
            "Content-Type": "application/json",
            "X-Created-By": createdBy,
        },
    };

    const url = `${process.env.AUTH_API_URL}/session/sessions`;
    fetch(url, option)
        .then(throwIfNotOk)
        .then(res => res.json())
        .then(async data => {
            const sessionKey: string = data.sessionKey;
            const expiredAt: Date = new Date(data.expiredAt);

            const userRedisKey: string = `users:${username}`;
            const existedUserSessionRedisKey = await redisClient.get(userRedisKey);
            if (existedUserSessionRedisKey) {
                await redisClient.del(`sessions:${existedUserSessionRedisKey}`);
            }

            const sessionRedisOption = {
                PXAT: expiredAt.getTime(),
            };
            const sessionRedisKey: string = `sessions:${sessionKey}`;
            await redisClient.set(sessionRedisKey, username, sessionRedisOption);
            await redisClient.set(userRedisKey, sessionKey, sessionRedisOption);

            response.cookie("session", sessionKey, {
                expires: expiredAt,
                domain: ".soia.asia",
                path: "/",
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            });
            response.status(200).send();
        })
        .catch(err => {
            if (!err.status || err.status === 401 || err.status == 500) console.error(err);
            response.status(err.status || 500).send(err);
        });
}