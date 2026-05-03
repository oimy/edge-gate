import {AuthorizationStrategy} from "@/service/authorization/strategy";
import express from "express";
import {parsePath, Path} from "@/service/utils/path.util";
import {EndpointMatchStrategy} from "@/service/endpoint/match/strategy";
import {getEndpointAccessStrategy, getEndpointMatchStrategy} from "@/service/endpoint";
import redisClient from "@/redis/client";
import {Endpoint, EndpointMethod} from "@/service/endpoint/models";
import {EndpointAccessStrategy} from "@/service/endpoint/access/strategy";
import {Server} from "@/service/server/models";


export class RoleAuthorizationStrategy implements AuthorizationStrategy {
    private serverSrlMap: Map<string, number> = new Map();

    private endpointMatchStrategy: EndpointMatchStrategy = getEndpointMatchStrategy();
    private endpointAccessStrategy: EndpointAccessStrategy = getEndpointAccessStrategy();

    async authorize(request: express.Request): Promise<boolean> {
        const path: Path | null = parsePath(request.path);
        if (!path) return false;
        const sessionKey: string | undefined = request.cookies["session"];
        if (!sessionKey) return false;
        const serverSrl: number | undefined = this.serverSrlMap.get(path.server);
        if (!serverSrl) return false;

        const method: EndpointMethod | undefined = this.parseRequestMethod(request.method);
        if (method !== 0 && !method) return false;
        const endpoint: Endpoint | undefined = this.endpointMatchStrategy.match(serverSrl, method, path.main);
        if (!endpoint) return false;
        const userRoleNamesText: string | null = await redisClient.get(`roles:${sessionKey}`);
        if (!userRoleNamesText) return false;

        const userRoleNames: string[] = JSON.parse(userRoleNamesText);
        return this.endpointAccessStrategy.verify(method, endpoint.path, userRoleNames);
    }

    private parseRequestMethod(method: string): EndpointMethod | undefined {
        switch (method) {
            case "GET":
                return EndpointMethod.GET;
            case "POST":
                return EndpointMethod.POST;
            case "PUT":
                return EndpointMethod.PUT;
            case "DELETE":
                return EndpointMethod.DELETE;
            case "PATCH":
                return EndpointMethod.PATCH;
            default:
                return undefined;
        }
    }

    upsertServer(server: Server): void {
        this.serverSrlMap.set(`${server.name}/v${server.version}`, server.srl);
    }

}