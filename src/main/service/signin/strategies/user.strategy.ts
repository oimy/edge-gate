import express from "express";
import {SigninStrategy} from "../strategy";
import {SignedUser, SigninResult, ValidateResult} from "../models";
import redisClient from "@/redis/client";
import {apiConfig} from "@/configuration/api.config";


export default class UserSigninStrategy implements SigninStrategy {
    protected readonly apiBaseUrl: string = apiConfig.authApiBaseUrl;

    validate(request: express.Request): ValidateResult {
        if (!request.body || !request.body.username || !request.body.password) {
            return {status: 400};
        }
        const createdBy = request.ip;
        if (!createdBy) {
            return {status: 403};
        }
        return {status: 200};
    }

    async do(request: express.Request): Promise<SigninResult> {
        const username: string = request.body.username;
        const createdBy = request.ip || "unknown";
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

        const url = `${this.apiBaseUrl}/session/sessions`;
        const res: Response = await fetch(url, option);
        if (!res.ok) {
            return {status: res.status};
        }
        const data = await res.json();
        if (!data || Object.keys(data).length !== 3) {
            return {status: 204};
        }

        const user: SignedUser = {
            srl: data.userSrl,
            name: username,
            sessionKey: data.sessionKey,
            expiredAt: new Date(data.expiredAt),
        };
        return {
            status: 200,
            user,
        };
    }

    async after(result: SigninResult, response: express.Response): Promise<void> {
        if (result.status !== 200 || !result.user) {
            throw new Error("provide failed result");
        }

        const expiredAt: Date = new Date(result.user.expiredAt);

        const userRedisKey: string = `users:${result.user.srl}`;
        const existedUserSessionKey = await redisClient.get(userRedisKey);
        if (existedUserSessionKey) {
            await redisClient.del(`sessions:${existedUserSessionKey}`);
        }

        const sessionRedisOption = {
            PXAT: expiredAt.getTime(),
        };
        const sessionRedisKey: string = `sessions:${result.user.sessionKey}`;
        await redisClient.set(sessionRedisKey, result.user.srl, sessionRedisOption);
        await redisClient.set(userRedisKey, result.user.sessionKey, sessionRedisOption);

        response.cookie("session", result.user.sessionKey, {
            expires: expiredAt,
            domain: ".soia.asia",
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: "lax",
        });
    }
}