import {SessionAuthenticationStrategy} from "@/service/authentication/strategies/session.strategy";
import express from "express";
import redisClient from "@/redis/client";

jest.mock("@/redis/client", () => ({
    get: jest.fn()
}));

describe("SessionAuthenticationStrategy", () => {
    const strategy = new SessionAuthenticationStrategy();

    describe("authenticate", () => {
        it("should return false if session cookie is missing", async () => {
            // given
            const givenRequest = {
                cookies: {}
            } as express.Request;

            // when
            const actualResult = await strategy.authenticate(givenRequest);

            // then
            expect(actualResult).toBe(false);
        });

        it("should return true if session is valid in redis", async () => {
            // given
            const givenSessionKey = "valid-session";
            const givenRequest = {
                cookies: {session: givenSessionKey}
            } as any;
            (redisClient.get as jest.Mock).mockResolvedValue("some-user-data");

            // when
            const actualResult = await strategy.authenticate(givenRequest);

            // then
            expect(actualResult).toBe(true);
            expect(redisClient.get).toHaveBeenCalledWith(`sessions:${givenSessionKey}`);
        });

        it("should return false if session is not found in redis", async () => {
            // given
            const givenSessionKey = "invalid-session";
            const givenRequest = {
                cookies: {session: givenSessionKey}
            } as any;
            (redisClient.get as jest.Mock).mockResolvedValue(null);

            // when
            const actualResult = await strategy.authenticate(givenRequest);

            // then
            expect(actualResult).toBe(false);
        });
    });
});
