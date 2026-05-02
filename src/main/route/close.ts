import express from "express";
import redirect from "@/service/redirect";
import authentication from "@/service/authentication";

export default function close(app: express.Application) {
    app.use("/api", authentication, redirect);
}
