import {RoleAuthorizationStrategy} from "@/service/authorization/strategies/role.strategy";
import redisClient from "@/redis/client";
import {Endpoint, EndpointMethod} from "@/service/endpoint/models";
import {Server} from "@/service/server/models";
import {AuthorizationStrategy} from "@/service/authorization/strategy";

jest.mock("@/redis/client", () => ({
    get: jest.fn(),
}));
jest.mock("@/configuration/api.config", () => ({
    apiConfig: {
        authApiBaseUrl: "http://auth",
    },
}));

describe("RoleAuthorizationStrategy", () => {
    let strategy: AuthorizationStrategy = new RoleAuthorizationStrategy();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("upsertServer", () => {
        it("should store server srl in map", () => {
            // given
            const givenServer: Server = {
                srl: 123,
                name: "test-server",
                version: 1,
                url: "http://test",
            };

            // when
            strategy.upsertServer(givenServer);

            // then
            expect((strategy as any).serverSrlMap.size).toBe(1);
        });
    });

    describe("authorize", () => {
        beforeEach(() => {
            const givenServer: Server = {
                srl: 1,
                name: 'server',
                version: 1,
                url: "http://test",
            };
            strategy.upsertServer(givenServer);
            const givenAllEndpointMethods: EndpointMethod[] = [
                EndpointMethod.GET,
                EndpointMethod.POST,
                EndpointMethod.PUT,
                EndpointMethod.DELETE,
                EndpointMethod.PATCH,
            ];
            const givenEndpoints: Endpoint[] = [
                ...givenAllEndpointMethods.map(method => ({
                    serverSrl: 1,
                    method: method,
                    path: "api",
                    roles: [{name: "ROLE_0"}],
                })), {
                    serverSrl: 1,
                    method: EndpointMethod.GET,
                    path: "some/:srl/yes",
                    roles: [{name: "ROLE_0"}],
                },
            ];
            givenEndpoints.forEach(endpoint => {
                (strategy as any).endpointMatchStrategy.upsertEndpoint(endpoint);
                (strategy as any).endpointAccessStrategy.upsertEndpoint(endpoint);
            });

            (redisClient.get as jest.Mock).mockImplementation((key: string) => {
                if (key === "roles:session-key") {
                    return Promise.resolve(JSON.stringify(["ROLE_0"]));
                }
                return Promise.resolve(null);
            });
        });

        it("should return false if path is invalid", async () => {
            // given
            const givenRequest: any = {
                path: "/invalid",
            };

            // when
            const actualIsAuthorized = await strategy.authorize(givenRequest);

            // then
            expect(actualIsAuthorized).toBe(false);
        });

        it("should return false if session cookie is missing", async () => {
            // given
            const givenRequest: any = {
                path: "/server/v1/api",
                cookies: {},
            };

            // when
            const actualIsAuthorized = await strategy.authorize(givenRequest);

            // then
            expect(actualIsAuthorized).toBe(false);
        });

        it("should return false if server srl is not found", async () => {
            // given
            const givenRequest: any = {
                path: "/unknown/v1/api",
                cookies: {session: "session-key"},
            };

            // when
            const actualIsAuthorized = await strategy.authorize(givenRequest);

            // then
            expect(actualIsAuthorized).toBe(false);
        });

        it("should return false if request method is invalid", async () => {
            // given
            const givenRequest: any = {
                path: "/server/v1/api",
                method: "INVALID",
                cookies: {session: "session-key"},
            };

            // when
            const actualIsAuthorized = await strategy.authorize(givenRequest);

            // then
            expect(actualIsAuthorized).toBe(false);
        });

        it("should return false if endpoint is not matched", async () => {
            // given
            const givenRequest: any = {
                path: "/server/v1/invalid",
                method: "GET",
                cookies: {session: "session-key"},
            };

            // when
            const actualIsAuthorized = await strategy.authorize(givenRequest);

            // then
            expect(actualIsAuthorized).toBe(false);
        });

        it("should return false if user roles are not found in redis", async () => {
            // given
            const givenRequest: any = {
                path: "/server/v1/api",
                method: "GET",
                cookies: {session: "session-key-0"},
            };

            // when
            const actualIsAuthorized = await strategy.authorize(givenRequest);

            // then
            expect(actualIsAuthorized).toBe(false);
            expect(redisClient.get).toHaveBeenCalledWith("roles:session-key-0");
        });

        it("should authorized if all valid", async () => {
            // given
            const givenRequest: any = {
                path: "/server/v1/api",
                method: "GET",
                cookies: {session: "session-key"},
            };

            // when
            const actualIsAuthorized = await strategy.authorize(givenRequest);

            // then
            expect(actualIsAuthorized).toBe(true);
        });

        it("should handle all methods", async () => {
            // given
            const givenRequestMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

            // when
            for (const givenEndpointMethod of givenRequestMethods) {
                const givenRequest: any = {
                    path: "/server/v1/api",
                    method: givenEndpointMethod,
                    cookies: {session: "session-key"},
                };

                await strategy.authorize(givenRequest);
            }

            // then
            expect(redisClient.get).toHaveBeenCalledTimes(5);
        });
    });
});
