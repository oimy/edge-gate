import {SimpleRedirectStrategy} from "@/service/redirect/strategies/simple.strategy";
import express from "express";
import {Server} from "@/service/server/models";

describe("SimpleRedirectStrategy", () => {
    let strategy: SimpleRedirectStrategy;

    beforeEach(() => {
        strategy = new SimpleRedirectStrategy();
    });

    describe("redirect", () => {
        it("should return 404 if path is too short", async () => {
            // given
            const givenRequest = {
                path: "/s/v"
            } as express.Request;

            // when
            const actualResult = await strategy.redirect(givenRequest);

            // then
            expect(actualResult.status).toBe(404);
        });

        it("should return 404 if path is invalid", async () => {
            // given
            const givenRequest = {
                path: "/invalid"
            } as express.Request;

            // when
            const actualResult = await strategy.redirect(givenRequest);

            // then
            expect(actualResult.status).toBe(404);
        });

        it("should return 404 if server is not found in map", async () => {
            // given
            const givenRequest = {
                path: "/server/v1/api/test"
            } as express.Request;

            // when
            const actualResult = await strategy.redirect(givenRequest);

            // then
            expect(actualResult.status).toBe(404);
        });

        it("should return 500 if fetch fails", async () => {
            // given
            const givenServer: Server = {
                srl: 1,
                name: "server",
                version: 1,
                url: "http://server"
            };
            strategy.upsertServer(givenServer);
            const givenRequest = {
                path: "/server/v1/api/test",
                query: {},
                header: jest.fn().mockReturnValue(undefined),
                method: "GET"
            } as any;
            global.fetch = jest.fn().mockRejectedValue(new Error("fetch failed"));

            // when
            const actualResult = await strategy.redirect(givenRequest);

            // then
            expect(actualResult.status).toBe(500);
        });

        it("should return response status and response on success", async () => {
            // given
            const givenServer: Server = {
                srl: 1,
                name: "server",
                version: 1,
                url: "http://server"
            };
            strategy.upsertServer(givenServer);
            const givenRequest = {
                path: "/server/v1/api/test",
                query: {a: "1"},
                header: jest.fn().mockReturnValue("application/json"),
                method: "POST",
                body: {key: "value"}
            } as any;
            const givenResponse = {
                status: 200,
                ok: true
            } as Response;
            global.fetch = jest.fn().mockResolvedValue(givenResponse);

            // when
            const actualResult = await strategy.redirect(givenRequest);

            // then
            expect(actualResult.status).toBe(200);
            expect(actualResult.res).toBe(givenResponse);
            const expectUrl: string = "http://server/api/test?a=1";
            const expectOption: RequestInit = {
                method: "POST",
                headers: {
                    "X-Created-By": "admin",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({key: "value"})
            };
            expect(global.fetch).toHaveBeenCalledWith(expectUrl, expectOption);
        });

        it("should handle request without query string", async () => {
            // given
            const givenServer: Server = {
                srl: 1,
                name: "server",
                version: 1,
                url: "http://server"
            };
            strategy.upsertServer(givenServer);
            const givenRequest = {
                path: "/server/v1/api/test",
                query: {},
                header: jest.fn().mockReturnValue(undefined),
                method: "GET"
            } as any;
            const givenResponse = {
                status: 200,
                ok: true
            } as Response;
            global.fetch = jest.fn().mockResolvedValue(givenResponse);

            // when
            const actualResult = await strategy.redirect(givenRequest);

            // then
            expect(actualResult.status).toBe(200);
            const expectUrl: string = "http://server/api/test";
            expect(global.fetch).toHaveBeenCalledWith(expectUrl, expect.any(Object));
        });
    });

    describe("upsertServer", () => {
        it("should update serverUrlMap", async () => {
            // given
            const givenServer: Server = {
                srl: 1,
                name: "server",
                version: 1,
                url: "http://server"
            };
            const givenRequest = {
                path: "/server/v1/api/test",
                query: {},
                header: jest.fn().mockReturnValue(undefined),
                method: "GET"
            } as any;
            global.fetch = jest.fn().mockResolvedValue({status: 200});

            // when
            strategy.upsertServer(givenServer);
            await strategy.redirect(givenRequest);

            // then
            expect(global.fetch).toHaveBeenCalledWith("http://server/api/test", expect.any(Object));
        });
    });
});
