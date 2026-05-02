import express from "express";
import {RedirectResult} from "@/service/redirect/models";
import {Server} from "@/service/server/models";

export interface RedirectStrategy {

    redirect(request: express.Request): Promise<RedirectResult>;

    upsertServer(server: Server): void;

}