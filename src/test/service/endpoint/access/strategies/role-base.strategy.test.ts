import {RoleBaseEndpointAccessStrategy} from "@/service/endpoint/access/strategies/role-base.strategy";
import {Endpoint} from "@/service/endpoint/models";
import {EndpointRoleCache} from "@/service/endpoint/access/cache";

jest.mock("@/service/endpoint/access/cache");

describe("RoleBaseEndpointAccessStrategy", () => {
    let strategy: RoleBaseEndpointAccessStrategy;
    let mockCache: jest.Mocked<EndpointRoleCache>;

    beforeEach(() => {
        jest.clearAllMocks();
        strategy = new RoleBaseEndpointAccessStrategy();
        mockCache = (strategy as any).cache;
    });

    describe("verify", () => {
        it("should return false if endpoint role names not found in cache", () => {
            // given
            const givenMethod = "GET" as any;
            const givenPath = "/api/test";
            const givenUserRoleNames = ["user"];
            mockCache.get.mockReturnValue(undefined);

            // when
            const actualResult = strategy.verify(givenMethod, givenPath, givenUserRoleNames);

            // then
            expect(actualResult).toBe(false);
            expect(mockCache.get).toHaveBeenCalledWith(givenMethod, givenPath);
        });

        it("should return true if user has at least one matching role", () => {
            // given
            const givenMethod = "GET" as any;
            const givenPath = "/api/test";
            const givenUserRoleNames = ["admin", "user"];
            const givenEndpointRoleNames = new Set(["admin", "super"]);
            mockCache.get.mockReturnValue(givenEndpointRoleNames);

            // when
            const actualResult = strategy.verify(givenMethod, givenPath, givenUserRoleNames);

            // then
            expect(actualResult).toBe(true);
        });

        it("should return false if user has no matching roles", () => {
            // given
            const givenMethod = "GET" as any;
            const givenPath = "/api/test";
            const givenUserRoleNames = ["guest"];
            const givenEndpointRoleNames = new Set(["admin", "user"]);
            mockCache.get.mockReturnValue(givenEndpointRoleNames);

            // when
            const actualResult = strategy.verify(givenMethod, givenPath, givenUserRoleNames);

            // then
            expect(actualResult).toBe(false);
        });
    });

    describe("upsertEndpoint", () => {
        it("should call cache.set with the endpoint", () => {
            // given
            const givenEndpoint: Endpoint = {
                method: "GET" as any,
                path: "/api/test",
                roles: [{name: "admin"}],
                serverSrl: 1
            };

            // when
            strategy.upsertEndpoint(givenEndpoint);

            // then
            expect(mockCache.set).toHaveBeenCalledWith(givenEndpoint);
        });
    });

    describe("upsertEndpoints", () => {
        it("should call cache.set for each endpoint", () => {
            // given
            const givenEndpoints: Endpoint[] = [
                {method: "GET" as any, path: "/api/1", roles: [], serverSrl: 1},
                {method: "POST" as any, path: "/api/2", roles: [], serverSrl: 1}
            ];

            // when
            strategy.upsertEndpoints(givenEndpoints);

            // then
            expect(mockCache.set).toHaveBeenCalledTimes(2);
            expect(mockCache.set).toHaveBeenNthCalledWith(1, givenEndpoints[0], 0, givenEndpoints);
            expect(mockCache.set).toHaveBeenNthCalledWith(2, givenEndpoints[1], 1, givenEndpoints);
        });
    });
});
