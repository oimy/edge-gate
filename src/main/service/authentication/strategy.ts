import express from "express";

export interface AuthenticationStrategy {
    authenticate(request: express.Request): Promise<boolean>;
}

