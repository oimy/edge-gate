import express from "express";
import {throwIfNotOk} from "../../common/handlers";

export default (request: express.Request, response: express.Response) => {
    if (!request.body || !request.body.username || !request.body.password) {
        return response.status(400).send();
    }
    const createdBy = request.ip;
    if (!createdBy) return response.status(403).send();

    const url = "http://localhost:8080/session/sessions";  // TODO temporary
    const option: RequestInit = {
        method: "POST",
        body: JSON.stringify({
            username: request.body.username,
            password: request.body.password,
        }),
        headers: {
            "Content-Type": "application/json",
            "X-Created-By": createdBy,
        },
    };

    fetch(url, option)
        .then(throwIfNotOk)
        .then(res => res.json())
        .then(data => {
            response.cookie("session", data.sessionKey, {
                expires: new Date(data.expiredAt),
                domain: ".soia.asia",
                path: "/",
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            });
            response.status(200).send();
        })
        .catch(err => {
            response.status(err.status || 500).send(err);
        });
}