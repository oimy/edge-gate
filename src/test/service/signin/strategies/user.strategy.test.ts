import UserSigninStrategy from "@/service/signin/strategies/user.strategy";
import express, {Request} from "express";
import {SignedUser, SigninResult, ValidateResult} from "@/service/signin/models";
import redisClient from "@/redis/client";
import {SigninStrategy} from "@/service/signin/strategy";

jest.mock("@/redis/client", () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
}));

jest.mock("@/configuration/api.config", () => ({
    apiConfig: {
        authApiBaseUrl: "http://auth",
    },
}));

describe("UserSigninStrategy", () => {
    let strategy: SigninStrategy = new UserSigninStrategy();

    describe("validate", () => {
        const validRequest: express.Request = {
            body: {
                username: "user",
                password: "pass",
            },
            ip: "127.0.0.1",
        } as unknown as Request;

        it("should return 400 if username missing", () => {
            // given
            const givenRequest = {
                ...validRequest,
                body: {password: "pass"},
            } as unknown as Request;

            // when
            const actualValidateResult: ValidateResult = strategy.validate(givenRequest);

            // then
            expect(actualValidateResult.status).toEqual(400);
        });

        it("should return 400 if password missing", () => {
            // given
            const givenRequest = {
                ...validRequest,
                body: {username: "user"},
            } as unknown as Request;

            // when
            const actualValidateResult: ValidateResult = strategy.validate(givenRequest);

            // then
            expect(actualValidateResult.status).toEqual(400);
        });

        it("should return 403 if request.ip is missing", () => {
            // given
            const givenRequest = {
                ...validRequest,
                ip: undefined,
            } as unknown as Request;

            // when
            const actualValidateResult: ValidateResult = strategy.validate(givenRequest);

            // then
            expect(actualValidateResult.status).toEqual(403);
        });

        it("should return 200 if all valid", () => {
            // given
            // when
            const actualValidateResult: ValidateResult = strategy.validate(validRequest);

            // then
            expect(actualValidateResult.status).toEqual(200);
        });
    });

    describe("do", () => {
        const givenRequest: express.Request = {
            body: {
                username: "user",
                password: "pass",
            },
            ip: "127.0.0.1",
        } as unknown as Request;

        it("should return 200 with user if all valid", async () => {
            // given
            const givenJson = {
                "userSrl": 1,
                "sessionKey": "session-key-0",
                "expiredAt": "2025-12-31T15:00:00.000Z",
            };
            const givenValidReturnValue = {
                ok: true,
                json: jest.fn().mockReturnValue(givenJson),
            };
            global.fetch = jest.fn().mockReturnValue(givenValidReturnValue);

            // when
            const actualResult: SigninResult = await strategy.do(givenRequest);

            // then
            expect(actualResult.status).toEqual(200);
            const expectUser: SignedUser = {
                srl: givenJson.userSrl,
                name: givenRequest.body.username,
                sessionKey: givenJson.sessionKey,
                expiredAt: new Date(givenJson.expiredAt),
            };
            expect(actualResult.user).toEqual(expectUser);
            expect(givenValidReturnValue.json).toHaveBeenCalledTimes(1);
        });

        it("should return 400 with non user if 400 status given", async () => {
            // given
            const givenValidReturnValue = {
                ok: false,
                status: 400,
                json: jest.fn(),
            };
            global.fetch = jest.fn().mockReturnValue(givenValidReturnValue);

            // when
            const actualResult: SigninResult = await strategy.do(givenRequest);

            // then
            expect(actualResult.status).toEqual(400);
            expect(actualResult.user).toBeUndefined();
            expect(givenValidReturnValue.json).toHaveBeenCalledTimes(0);
        });

        it("should return 204 with non user if empty res.json given", async () => {
            // given
            const givenValidReturnValue = {
                ok: true,
                json: jest.fn().mockReturnValue({}),
            };
            global.fetch = jest.fn().mockReturnValue(givenValidReturnValue);

            // when
            const actualResult: SigninResult = await strategy.do(givenRequest);

            // then
            expect(actualResult.status).toEqual(204);
            expect(actualResult.user).toBeUndefined();
            expect(givenValidReturnValue.json).toHaveBeenCalledTimes(1);
        });
    });

    describe("after", () => {
        const validResult: SigninResult = {
            status: 200,
            user: {
                srl: 1,
                name: "test",
                sessionKey: "session-key-0",
                expiredAt: new Date("2026-01-01T00:00:00.000Z"),
            },
        };
        let givenResponse: express.Response;

        beforeEach(() => {
            givenResponse = {
                cookie: jest.fn(),
            } as unknown as express.Response;
        });

        it("should raise Error if failed result or non user given", async () => {
            // given
            const givenFailedResult: SigninResult = {status: 400};
            const givenNonUserResult: SigninResult = {status: 200};

            // when & then
            await expect(strategy.after(givenFailedResult, givenResponse)).rejects.toThrow("provide failed result");
            await expect(strategy.after(givenNonUserResult, givenResponse)).rejects.toThrow("provide failed result");
        });

        it("should save to redis and cookie if valid result given", async () => {
            // given
            if (!validResult.user) {
                expect(validResult.user).not.toBeUndefined();
                return;
            }

            // when
            await strategy.after(validResult, givenResponse);

            // then
            const expectSessionRedisKey = `sessions:${validResult.user.sessionKey}`;
            const expectSessionRedisOption = {
                PXAT: validResult.user.expiredAt.getTime(),
            };
            expect(redisClient.set).toHaveBeenCalledWith(expectSessionRedisKey, validResult.user.srl, expectSessionRedisOption);
            const expectUserRedisKey = `users:${validResult.user.name}`;
            expect(redisClient.set).toHaveBeenCalledWith(expectUserRedisKey, validResult.user.sessionKey, expectSessionRedisOption);

            const expectCookieName = "session";
            const expectResponseCookie = {
                expires: validResult.user.expiredAt,
                domain: ".soia.asia",
                path: "/",
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            };
            expect(givenResponse.cookie).toHaveBeenCalledWith(expectCookieName, validResult.user.sessionKey, expectResponseCookie);
        });

        it("should replace redis sessions if usernames already saved in redis", async () => {
            // given
            if (!validResult.user) {
                expect(validResult.user).not.toBeUndefined();
                return;
            }
            const givenOldSessionKey = "old-session-key-0";
            (redisClient.get as jest.Mock).mockResolvedValue(givenOldSessionKey);

            // when
            await strategy.after(validResult, givenResponse);

            // then
            const expectDeletedSessionRedisKey = `sessions:${givenOldSessionKey}`;
            expect(redisClient.del).toHaveBeenCalledWith(expectDeletedSessionRedisKey);
            expect(redisClient.set).toHaveBeenCalledTimes(2);

            const expectNewSessionRedisKey = `sessions:${validResult.user.sessionKey}`;
            const expectSessionRedisOption = {
                PXAT: validResult.user.expiredAt.getTime(),
            };
            expect(redisClient.set).toHaveBeenCalledWith(expectNewSessionRedisKey, validResult.user.srl, expectSessionRedisOption);
        });
    });

});