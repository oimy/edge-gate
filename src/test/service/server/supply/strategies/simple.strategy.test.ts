import {SimpleServerSupplyStrategy} from "@/service/server/supply/strategies/simple.strategy";
import {Server} from "@/service/server/models";

jest.mock("@/configuration/api.config", () => ({
    apiConfig: {
        authApiBaseUrl: "http://auth",
    },
}));

describe("SimpleServerSupplyStrategy", () => {
    const strategy = new SimpleServerSupplyStrategy();

    describe("supply", () => {
        it("should return servers on success", async () => {
            // given
            const givenServers: Server[] = [
                {
                    srl: 1,
                    name: "server1",
                    version: 1,
                    url: "http://s1",
                },
                {
                    srl: 1,
                    name: "server2",
                    version: 2,
                    url: "http://s2",
                },
            ];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenServers),
            };
            global.fetch = jest.fn().mockResolvedValue(givenResponse);

            // when
            const actualServers = await strategy.supply();

            // then
            expect(actualServers).toEqual(givenServers);
            expect(global.fetch).toHaveBeenCalledWith("http://auth/server/servers", {method: "GET"});
        });

        it("should return empty array if fetch fails", async () => {
            // given
            const givenResponse = {
                ok: false,
            };
            global.fetch = jest.fn().mockResolvedValue(givenResponse);
            console.error = jest.fn();

            // when
            const actualServers = await strategy.supply();

            // then
            expect(actualServers).toEqual([]);
            expect(console.error).toHaveBeenCalledWith("failed to fetch servers");
        });

        it("should return empty array if data format is invalid", async () => {
            // given
            const givenInvalidData = [{name: "server1"}]; // missing version and url
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenInvalidData),
            };
            global.fetch = jest.fn().mockResolvedValue(givenResponse);
            console.error = jest.fn();

            // when
            const actualServers = await strategy.supply();

            // then
            expect(actualServers).toEqual([]);
            expect(console.error).toHaveBeenCalledWith("invalid data format received from api");
        });

        it("should return true for empty array in validation", async () => {
            // given
            const givenData: any[] = [];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenData),
            };
            global.fetch = jest.fn().mockResolvedValue(givenResponse);

            // when
            const actualServers = await strategy.supply();

            // then
            expect(actualServers).toEqual([]);
        });

        it("should return false if data is not an array", async () => {
            // given
            const givenData = {not: "an array"};
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenData),
            };
            global.fetch = jest.fn().mockResolvedValue(givenResponse);
            console.error = jest.fn();

            // when
            const actualServers = await strategy.supply();

            // then
            expect(actualServers).toEqual([]);
        });

        it("should return false if item properties have wrong types", async () => {
            // given
            const givenData = [
                {
                    name: 1,
                    version: 1,
                    url: "http://s1",
                },
                {
                    name: "s2",
                    version: "1",
                    url: "http://s2",
                },
                {
                    name: "s3",
                    version: 1,
                    url: 1,
                },
            ];

            for (const item of givenData) {
                const givenResponse = {
                    ok: true,
                    json: jest.fn().mockResolvedValue([item]),
                };
                global.fetch = jest.fn().mockResolvedValue(givenResponse);

                // when
                const actualServers = await strategy.supply();

                // then
                expect(actualServers).toEqual([]);
            }
        });
    });
});
