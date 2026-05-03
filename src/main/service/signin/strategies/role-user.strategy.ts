import express from "express";
import {SigninResult} from "../models";
import UserSigninStrategy from "@/service/signin/strategies/user.strategy";
import redisClient from "@/redis/client";
import {Role} from "@/service/endpoint/models";

const GET_FETCH_OPTIONS: RequestInit = {
    method: "GET",
} as const;

export class RoleUserSigninStrategy extends UserSigninStrategy {
    async after(result: SigninResult, response: express.Response): Promise<void> {
        await super.after(result, response);
        if (!result.user) {
            throw new Error("provide failed result");
        }

        const url = `${this.apiBaseUrl}/account/users/${result.user.srl}/roles`;
        let res: Response;
        try {
            res = await fetch(url, GET_FETCH_OPTIONS);
        } catch (err) {
            console.error(err);
            return;
        }

        const roles: Role[] = await this.fetchRoles(res);
        const roleNames: string[] = roles.map((role: Role) => role.name);
        const roleRedisKey: string = `roles:${result.user.sessionKey}`;
        const roleRedisOption = {
            PXAT: new Date(result.user.expiredAt).getTime(),
        };
        await redisClient.set(roleRedisKey, JSON.stringify(roleNames), roleRedisOption);
    }

    private async fetchRoles(res: Response): Promise<Role[]> {
        const data = await res.json();

        if (!Array.isArray(data)) {
            console.error("not array 'role' received from api");
            return [];
        }
        if (data.length === 0) {
            return data;
        }

        if (data.every((item: any) => typeof item.name === "string")) {
            return data as Role[];
        }
        console.error("invalid data format 'role' received from api");
        return [];
    }
}