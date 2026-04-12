#!/usr/bin/env node

import {createServer} from "http";
import app from "./app";
import redisClient from "./main/redis/client";
import {Server} from "node:http";

async function startServer() {
    await redisClient.connect();
    console.log("Redis connected successfully");

    const server: Server = createServer(app);
    server.listen(process.env.PORT);
}

startServer()
    .then(() => console.log("[server] server started"))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
