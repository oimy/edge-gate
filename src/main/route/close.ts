import express from "express";
import redirect from "../service/close/redirect";
import authenticate from "../service/close/authenticate";


export default function close(app: express.Application) {
    app.use("/api", authenticate, redirect);
}
