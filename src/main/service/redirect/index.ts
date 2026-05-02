import express from "express";
import {RedirectStrategy} from "@/service/redirect/strategy";
import {SimpleRedirectStrategy} from "@/service/redirect/strategies/simple.strategy";
import {ServerSupplyStrategy} from "@/service/server/supply/strategy";
import {getServerSupplyStrategy} from "@/service/server";
import {Server} from "@/service/server/models";
import {RedirectResult} from "@/service/redirect/models";
import service from "@/service";


const strategy: RedirectStrategy = new SimpleRedirectStrategy();
service.addInitializable(async () => {
    const serverSupplyStrategy: ServerSupplyStrategy = getServerSupplyStrategy();
    const servers: Server[] = await serverSupplyStrategy.supply();
    servers.forEach(strategy.upsertServer);
});
export const getRedirectStrategy = () => strategy;

export default async (request: express.Request, response: express.Response) => {
    const redirectResult: RedirectResult = await strategy.redirect(request);
    response.status(redirectResult.status).send(redirectResult.res?.body);
}