import express from "express";
import {SessionAuthenticationStrategy} from "@/service/authentication/strategies/session.strategy";

const authenticationStrategy = new SessionAuthenticationStrategy();
export const getAuthenticationStrategy = () => authenticationStrategy;

export default async (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const isAuthenticated: boolean = await authenticationStrategy.authenticate(request);
    if (!isAuthenticated) {
        response.send(403).send();
        return;
    }
    next();
}