import express from "express";
import {RedirectStrategy} from "@/service/redirect/strategy";
import {SimpleRedirectStrategy} from "@/service/redirect/strategies/simple.strategy";
import {ServerSupplyStrategy} from "@/service/server/supply/strategy";
import {getServerSupplyStrategy} from "@/service/server";
import {Server} from "@/service/server/models";
import {RedirectResult} from "@/service/redirect/models";
import service from "@/service";
import {Readable} from "node:stream";


const strategy: RedirectStrategy = new SimpleRedirectStrategy();
service.addInitializable(async () => {
    const serverSupplyStrategy: ServerSupplyStrategy = getServerSupplyStrategy();
    const servers: Server[] = await serverSupplyStrategy.supply();
    servers.forEach((server) => strategy.upsertServer(server));
});
export const getRedirectStrategy = () => strategy;

export default async (request: express.Request, response: express.Response) => {
    const redirectResult: RedirectResult = await strategy.redirect(request);
    if (!redirectResult.res) return response.status(redirectResult.status).send();

    const res = redirectResult.res;
    const body = res.body;
    const redirectedResponse = response.status(res.status)
    if (body === null || body === undefined) {
        return redirectedResponse.send();
    }
    if (body instanceof  ReadableStream) {
        return Readable.fromWeb(body as any).pipe(redirectedResponse);
    }
    if (typeof body === 'object') {
        return redirectedResponse.json(body);
    }
    return redirectedResponse.send(body);
}