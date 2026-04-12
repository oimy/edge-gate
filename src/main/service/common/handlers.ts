import express from "express";
import {ApiError} from "./errors";

export async function throwIfNotOk(res: Response) {
    if (!res.ok) {
        const message: string = await res.text();
        throw new ApiError(message, res.status);
    }
    return res;
}


export function fulfill(res: Response, response: express.Response) {
    const contentType: string = res.headers.get("content-type") || "text/plain";
    response.header({
        "Content-Type": contentType,
    });
    if (contentType.startsWith("application/json")) {
        res.json()
            .then(json => response.status(res.status).send(json))
            .catch(err => response.status(500).send(err.message));
        return;
    }

    response.status(res.status).send();
}