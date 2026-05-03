import express from "express";
import {AuthorizationStrategy} from "@/service/authorization/strategy";
import {RoleAuthorizationStrategy} from "@/service/authorization/strategies/role.strategy";
import service from "@/service";
import {getServerSupplyStrategy} from "@/service/server";
import {ServerSupplyStrategy} from "@/service/server/supply/strategy";
import {Server} from "@/service/server/models";

const strategy: AuthorizationStrategy = new RoleAuthorizationStrategy();
export const getAuthorizationStrategy = () => strategy;
service.addInitializable(async () => {
    const serverSupplyStrategy: ServerSupplyStrategy = getServerSupplyStrategy();
    const servers: Server[] = await serverSupplyStrategy.supply();
    servers.forEach((server) => strategy.upsertServer(server));
});

export default async (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const isAuthorized = await strategy.authorize(request);
    if (!isAuthorized) {
        response.status(401).send();
        return;
    }
    next();
}