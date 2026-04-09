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

    const baseUrl = "http://localhost:8080"; // TODO temporary
    const queryString = new URLSearchParams(request.query as any).toString();
    const url = `${baseUrl}${path.main}${queryString ? `?${queryString}` : ''}`;

    const option: RequestInit = {
        method: request.method,
    };
    if (request.header("content-type") === "application/json") {
        option.headers = {"Content-Type": "application/json"};
        option.body = JSON.stringify(request.body);
    }

    fetch(url, option)
        .then(throwIfNotOk)
        .then(res => fulfill(res, response))
        .catch(err => response.status(500).send(err));
};
