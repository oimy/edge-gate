import express from "express";
import {Server} from "@/service/server/models";

export interface AuthorizationStrategy {

    authorize(request: express.Request): Promise<boolean>;

    upsertServer(server: Server): void

}