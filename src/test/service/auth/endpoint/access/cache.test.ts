import {EndpointRoleCache} from "@/service/auth/endpoint/access/cache";
import {Endpoint, EndpointMethod} from "@/service/auth/endpoint/models";

describe("EndpointRoleCache", () => {
    let cache: EndpointRoleCache;

    beforeEach(() => {
        cache = new EndpointRoleCache();
    });

    describe("set", () => {
        it("should store endpoint roles in the map", async () => {
            // given
            const givenEndpoint: Endpoint = {
                method: EndpointMethod.GET,
                path: "/api/test",
                roles: [{ name: "ROLE_USER" }, { name: "ROLE_ADMIN" }],
                serverSrl: 1
            };

            // when
            cache.set(givenEndpoint);

            // then
            const actualRoles = cache.get(EndpointMethod.GET, "/api/test");
            const expectRoles: Set<string> = new Set(["ROLE_USER", "ROLE_ADMIN"]);
            expect(actualRoles).toEqual(expectRoles);
        });
    });

    describe("get", () => {
        it("should return undefined if endpoint is not in cache", async () => {
            // given
            const givenMethod: EndpointMethod = EndpointMethod.POST;
            const givenPath: string = "/api/unknown";

            // when
            const actualRoles = cache.get(givenMethod, givenPath);

            // then
            expect(actualRoles).toBeUndefined();
        });

        it("should return the correct roles for a stored endpoint", async () => {
            // given
            const givenEndpoint: Endpoint = {
                method: EndpointMethod.PUT,
                path: "/api/update",
                roles: [{ name: "ROLE_EDITOR" }],
                serverSrl: 2
            };
            cache.set(givenEndpoint);

            // when
            const actualRoles = cache.get(EndpointMethod.PUT, "/api/update");

            // then
            const expectRoles: Set<string> = new Set(["ROLE_EDITOR"]);
            expect(actualRoles).toEqual(expectRoles);
        });
    });
});
