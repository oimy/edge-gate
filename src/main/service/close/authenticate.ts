import express from "express";

export default (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const sessionKey = request.cookies["session"];
    if (!sessionKey) return response.status(403).send(); // TODO temporary
    next();
}