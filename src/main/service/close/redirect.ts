import express from "express";
import {fulfill, throwIfNotOk} from "../common/handlers";

interface Path {
    server: string;
    main: string;
}

const parsePath = (rawPath: string): Path | null => {
    const versionIndex = rawPath.indexOf('/', 1);
    const mainIndex = rawPath.indexOf('/', versionIndex + 1);
    if (mainIndex < 0) return null;

    return {
        server: rawPath.substring(0, mainIndex),
        main: rawPath.substring(mainIndex),
    };
};

export default (request: express.Request, response: express.Response) => {
    const path = parsePath(request.path);
    if (!path) return response.status(404).send();

    const baseUrl = process.env.AUTH_API_URL;
    const queryString = new URLSearchParams(request.query as any).toString();
    const url = `${baseUrl}${path.main}${queryString ? `?${queryString}` : ''}`;
    const headers: Record<string, string> = {};
    let body: string | null = null;
    headers["X-Created-By"] = "admin";
    if (request.header("content-type") === "application/json") {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(request.body);
    }
    const option: RequestInit = {
        method: request.method,
        headers: headers,
        body: body,
    };

    fetch(url, option)
        .then(throwIfNotOk)
        .then(res => fulfill(res, response))
        .catch(err => {
            console.error(err);
            response.status(500).send(err)
        });
};
