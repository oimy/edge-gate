import {TimeBaseEndpointSupplyStrategy} from "@/service/endpoint/supply/strategies/time-base.strategy";
import {Endpoint} from "@/service/endpoint/models";
import {EndpointSupplyStrategy} from "@/service/endpoint/supply/strategy";


jest.mock("@/configuration/api.config", () => ({
    apiConfig: {
        authApiBaseUrl: "http://auth"
    }
}));

describe("TimeBaseEndpointSupplyStrategy", () => {
    const strategy: EndpointSupplyStrategy = new TimeBaseEndpointSupplyStrategy();

    describe("supply", () => {
        it("should return endpoints and update lastCheckedTime on success", async () => {
            // given
            const givenEndpoints: Endpoint[] = [{
                serverSrl: 1,
                method: "GET" as any,
                path: "/api/test",
                roles: [{name: "string"}],
            }];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenEndpoints),
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual(givenEndpoints);
            const expectLastCheckedTimeParameter: string = "http://auth/server/role-endpoints?afterModifiedAt=1989-12-31T15%3A00%3A00.000Z"
            expect(global.fetch).toHaveBeenCalledWith(expectLastCheckedTimeParameter, {method: "GET"});
        });

        it("should return empty array if fetch fails", async () => {
            // given
            const givenResponse = {
                ok: false,
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);
            console.error = jest.fn();

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual([]);
            expect(console.error).toHaveBeenCalledWith("failed to fetch endpoints");
        });

        it("should return empty array if received data format is invalid (not array)", async () => {
            // given
            const givenInvalidData = {not: "an array"};
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenInvalidData),
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);
            console.error = jest.fn();

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual([]);
            expect(console.error).toHaveBeenCalledWith("invalid data format received from api");
        });

        it("should return empty array if received data format is invalid (wrong item properties)", async () => {
            // given
            const givenInvalidData = [{
                serverSrl: "not a number",
                method: "GET",
                path: "/api/test",
                roles: [],
            }];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenInvalidData),
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);
            console.error = jest.fn();

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual([]);
            expect(console.error).toHaveBeenCalledWith("invalid data format received from api");
        });

        it("should return endpoints if roles[0].name is a string", async () => {
            // given
            const givenEndpoints = [{
                serverSrl: 1,
                method: "GET",
                path: "/api/test",
                roles: [{name: "ADMIN"}],
            }];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenEndpoints),
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual(givenEndpoints);
        });

        it("should return empty array if roles is not an array", async () => {
            // given
            const givenInvalidData = [{
                serverSrl: 1,
                method: "GET",
                path: "/api/test",
                roles: "not-an-array",
            }];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenInvalidData),
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);
            console.error = jest.fn();

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual([]);
            expect(console.error).toHaveBeenCalledWith("invalid data format received from api");
        });

        it("should return empty array if path is not a string", async () => {
            // given
            const givenInvalidData = [{
                serverSrl: 1,
                method: "GET",
                path: 123,
                roles: [],
            }];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenInvalidData),
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);
            console.error = jest.fn();

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual([]);
            expect(console.error).toHaveBeenCalledWith("invalid data format received from api");
        });

        it("should return empty array if method is not a string", async () => {
            // given
            const givenInvalidData = [{
                serverSrl: 1,
                method: 123,
                path: "/api/test",
                roles: [],
            }];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenInvalidData),
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);
            console.error = jest.fn();

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual([]);
            expect(console.error).toHaveBeenCalledWith("invalid data format received from api");
        });

        it("should return endpoints if roles is empty array", async () => {
            // given
            const givenEndpoints = [{
                serverSrl: 1,
                method: "GET",
                path: "/api/test",
                roles: [],
            }];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenEndpoints),
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual(givenEndpoints);
        });

        it("should return empty array if roles[0].name is not a string", async () => {
            // given
            const givenInvalidData = [{
                serverSrl: 1,
                method: "GET",
                path: "/api/test",
                roles: [{name: 123}],
            }];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenInvalidData),
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);
            console.error = jest.fn();

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual([]);
            expect(console.error).toHaveBeenCalledWith("invalid data format received from api");
        });

        it("should return empty array if endpoints is empty array", async () => {
            // given
            const givenEndpoints: any[] = [];
            const givenResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(givenEndpoints),
            };
            global.fetch = jest.fn().mockReturnValue(givenResponse);

            // when
            const actualEndpoints = await strategy.supply();

            // then
            expect(actualEndpoints).toEqual([]);
        });
    });
});
