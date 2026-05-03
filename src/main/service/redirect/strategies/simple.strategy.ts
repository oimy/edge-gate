import {RedirectStrategy} from "@/service/redirect/strategy";
import express from "express";
import {Server} from "@/service/server/models";
import {RedirectResult} from "@/service/redirect/models";
import {parsePath, Path} from "@/service/utils/path.util";

export class SimpleRedirectStrategy implements RedirectStrategy {
    private serverUrlMap: Map<string, string> = new Map();

    async redirect(request: express.Request): Promise<RedirectResult> {
        const path: Path | null = parsePath(request.path);
        if (!path) {
            return {status: 404};
        }
        const baseUrl = this.serverUrlMap.get(path.server);
        if (!baseUrl) {
            return {status: 404};
        }
        const queryString = new URLSearchParams(request.query as any).toString();
        const url = `${baseUrl}/${path.main}${queryString ? `?${queryString}` : ''}`;
        const headers: Record<string, string> = {};
        let body: string | null = null;
        headers["X-Created-By"] = "admin";
        if (request.header("content-type") === "application/json") {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(request.body);
        }
        const option: RequestInit = {
            method: request.method,
            headers: headers,
            body: body,
        };

        let res: Response;
        try {
            res = await fetch(url, option);
        } catch (err) {
            console.error(err);
            return {status: 500};
        }
        return {
            status: res.status,
            res,
        };
    }

    upsertServer(server: Server): void {
        this.serverUrlMap.set(`${server.name}/v${server.version}`, server.url);
    }

}