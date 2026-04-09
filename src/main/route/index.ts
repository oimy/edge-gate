import express from "express";
import open from "./open";
import close from "./close";

export default function route(app: express.Application) {
    open(app);
    close(app);
}