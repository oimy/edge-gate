import express from "express";
import signin from "../service/signin";


export default function open(app: express.Application) {
    app.post("/edge/auth/signin", signin);
}
