import express from "express";
import redirect from "@/service/redirect";
import authentication from "@/service/authentication";
import authorization from "@/service/authorization";

export default function close(app: express.Application) {
    app.use("/api", authentication, authorization, redirect);
}
