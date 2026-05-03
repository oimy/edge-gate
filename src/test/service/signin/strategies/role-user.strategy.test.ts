import express from "express";
import {RoleUserSigninStrategy} from "@/service/signin/strategies/role-user.strategy";
import {SigninResult} from "@/service/signin/models";
import UserSigninStrategy from "@/service/signin/strategies/user.strategy";
import redisClient from "@/redis/client";

jest.mock("@/redis/client", () => ({
    set: jest.fn(),
}));

jest.mock("@/configuration/api.config", () => ({
    apiConfig: {
        authApiBaseUrl: "http://auth"
    }
}));

describe("RoleUserSigninStrategy", () => {
    let strategy: RoleUserSigninStrategy;
    let mockResponse: express.Response;

    beforeEach(() => {
        strategy = new RoleUserSigninStrategy();
        mockResponse = {} as express.Response;
        jest.clearAllMocks();
    });

    describe("after", () => {
        it("should throw error if result.user is missing", async () => {
            // given
            const givenResult: SigninResult = { status: 200 };
            const givenResponse: express.Response = mockResponse;
            jest.spyOn(UserSigninStrategy.prototype, "after").mockResolvedValue(undefined);

            // when & then
            await expect(strategy.after(givenResult, givenResponse)).rejects.toThrow("provide failed result");
        });

        it("should call super.after and save roles to redis on success", async () => {
            // given
            const givenUser = {
                srl: 123,
                name: "testuser",
                sessionKey: "session123",
                expiredAt: new Date(Date.now() + 3600000),
            };
            const givenResult: SigninResult = {
                status: 200,
                user: givenUser,
            };
            const givenResponse: express.Response = mockResponse;
            const givenRoles = [{ name: "ROLE_USER" }, { name: "ROLE_ADMIN" }];
            const givenFetchResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenRoles),
            };
            global.fetch = jest.fn().mockResolvedValue(givenFetchResponse);
            const superAfterSpy = jest.spyOn(UserSigninStrategy.prototype, "after").mockResolvedValue(undefined);

            // when
            await strategy.after(givenResult, givenResponse);

            // then
            expect(superAfterSpy).toHaveBeenCalledWith(givenResult, givenResponse);
            const expectUrl = "http://auth/account/users/123/roles";
            expect(global.fetch).toHaveBeenCalledWith(expectUrl, { method: "GET" });
            const expectRedisKey = "roles:session123";
            const expectRedisValue = JSON.stringify(["ROLE_USER", "ROLE_ADMIN"]);
            const expectRedisOption = { PXAT: givenUser.expiredAt.getTime() };
            expect(redisClient.set).toHaveBeenCalledWith(expectRedisKey, expectRedisValue, expectRedisOption);
        });

        it("should log error and return if fetch fails", async () => {
            // given
            const givenUser = {
                srl: 123,
                name: "testuser",
                sessionKey: "session123",
                expiredAt: new Date(Date.now() + 3600000),
            };
            const givenResult: SigninResult = {
                status: 200,
                user: givenUser,
            };
            const givenResponse: express.Response = mockResponse;
            global.fetch = jest.fn().mockRejectedValue(new Error("network error"));
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            jest.spyOn(UserSigninStrategy.prototype, "after").mockResolvedValue(undefined);

            // when
            await strategy.after(givenResult, givenResponse);

            // then
            expect(consoleSpy).toHaveBeenCalled();
            expect(redisClient.set).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it("should log error if received data is not an array", async () => {
            // given
            const givenUser = {
                srl: 123,
                name: "testuser",
                sessionKey: "session123",
                expiredAt: new Date(Date.now() + 3600000),
            };
            const givenResult: SigninResult = {
                status: 200,
                user: givenUser,
            };
            const givenResponse: express.Response = mockResponse;
            const givenFetchResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({ error: "not an array" }),
            };
            global.fetch = jest.fn().mockResolvedValue(givenFetchResponse);
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            jest.spyOn(UserSigninStrategy.prototype, "after").mockResolvedValue(undefined);

            // when
            await strategy.after(givenResult, givenResponse);

            // then
            expect(consoleSpy).toHaveBeenCalledWith("not array 'role' received from api");
            expect(redisClient.set).toHaveBeenCalledWith("roles:session123", "[]", { PXAT: givenUser.expiredAt.getTime() });
            consoleSpy.mockRestore();
        });

        it("should handle empty array of roles", async () => {
            // given
            const givenUser = {
                srl: 123,
                name: "testuser",
                sessionKey: "session123",
                expiredAt: new Date(Date.now() + 3600000),
            };
            const givenResult: SigninResult = {
                status: 200,
                user: givenUser,
            };
            const givenResponse: express.Response = mockResponse;
            const givenFetchResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue([]),
            };
            global.fetch = jest.fn().mockResolvedValue(givenFetchResponse);
            jest.spyOn(UserSigninStrategy.prototype, "after").mockResolvedValue(undefined);

            // when
            await strategy.after(givenResult, givenResponse);

            // then
            expect(redisClient.set).toHaveBeenCalledWith("roles:session123", "[]", { PXAT: givenUser.expiredAt.getTime() });
        });

        it("should log error if roles format is invalid", async () => {
            // given
            const givenUser = {
                srl: 123,
                name: "testuser",
                sessionKey: "session123",
                expiredAt: new Date(Date.now() + 3600000),
            };
            const givenResult: SigninResult = {
                status: 200,
                user: givenUser,
            };
            const givenResponse: express.Response = mockResponse;
            const givenFetchResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue([{ name: 123 }]),
            };
            global.fetch = jest.fn().mockResolvedValue(givenFetchResponse);
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            jest.spyOn(UserSigninStrategy.prototype, "after").mockResolvedValue(undefined);

            // when
            await strategy.after(givenResult, givenResponse);

            // then
            expect(consoleSpy).toHaveBeenCalledWith("invalid data format 'role' received from api");
            expect(redisClient.set).toHaveBeenCalledWith("roles:session123", "[]", { PXAT: givenUser.expiredAt.getTime() });
            consoleSpy.mockRestore();
        });
    });
});
