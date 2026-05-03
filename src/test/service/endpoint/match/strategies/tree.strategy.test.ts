import {TreeEndpointMatchStrategy} from "@/service/endpoint/match/strategies/tree.strategy";
import {EndpointMatchStrategy} from "@/service/endpoint/match/strategy";
import {Endpoint, EndpointMethod} from "@/service/endpoint/models";

jest.mock("@/service/endpoint/access/cache");

describe("TreeEndpointMatchStrategy", () => {
    let strategy: EndpointMatchStrategy;

    beforeEach(() => {
        strategy = new TreeEndpointMatchStrategy();
    });

    describe("insert", () => {
        it("should has depth 2 node if proper index and method and 2 depth's path", () => {
            // given
            const givenIndex = 2;
            const givenMethod = EndpointMethod.GET;
            const givenPathParts = ["hello", "world"];
            const givenEndpoints: Endpoint[] = [{
                serverSrl: givenIndex,
                method: givenMethod,
                path: givenPathParts.join("/"),
                roles: [],
            }];

            // when
            for (const givenEndpoint of givenEndpoints) {
                strategy.upsertEndpoint(givenEndpoint);
            }

            // then
            const tree = (strategy as any).trees[givenIndex];
            expect(tree).toBeDefined();
            const root = tree.getPath(givenMethod.valueOf());
            expect(root).toBeDefined();
            expect(root.children.size).toBe(1);
            const depth1 = root.children.get(givenPathParts[0]);
            expect(depth1).toBeDefined();
            expect(depth1.endpoint).toBeUndefined();
            expect(depth1.hasVariable).toBeFalsy();
            expect(depth1.children.size).toBe(1);
            const depth2 = depth1.children.get(givenPathParts[1]);
            expect(depth2).toBeDefined();
            expect(depth2.endpoint).toBeDefined();
            expect(depth2.hasVariable).toBeFalsy();
        });

        it("should be variable if path variable (start with :) given", () => {
            // given
            const givenIndex = 2;
            const givenMethod = EndpointMethod.GET;
            const givenPathParts = ["hello", ":world", "yes"];
            const givenEndpoints: Endpoint[] = [{
                serverSrl: givenIndex,
                method: givenMethod,
                path: givenPathParts.join("/"),
                roles: [],
            }];

            // when
            for (const givenEndpoint of givenEndpoints) {
                strategy.upsertEndpoint(givenEndpoint);
            }

            // then
            const tree = (strategy as any).trees[givenIndex];
            expect(tree).toBeDefined();
            const root = tree.getPath(givenMethod.valueOf());
            expect(root).toBeDefined();
            expect(root.children.size).toBe(1);
            const depth1 = root.children.get(givenPathParts[0]);
            expect(depth1).toBeDefined();
            expect(depth1.endpoint).toBeUndefined();
            expect(depth1.hasVariable).toBeTruthy();
            expect(depth1.children.size).toBe(1);
            const depth2 = depth1.children.get("@var");
            expect(depth2).toBeDefined();
            expect(depth2.endpoint).toBeUndefined();
            expect(depth2.hasVariable).toBeFalsy();
            expect(depth2.children.size).toBe(1);
            const depth3 = depth2.children.get(givenPathParts[2]);
            expect(depth3).toBeDefined();
            expect(depth3.endpoint).toBeDefined();
            expect(depth3.hasVariable).toBeFalsy();
            expect(depth3.children.size).toBe(0);
        });

        it("should has 3 branches if 3 test cases with same index and method", () => {
            // given
            const givenIndex = 1;
            const givenMethod = EndpointMethod.POST;
            const givenEndpoints: Endpoint[] = [{
                serverSrl: givenIndex,
                method: givenMethod,
                path: "hello/world",
                roles: [],
            }, {
                serverSrl: givenIndex,
                method: givenMethod,
                path: "hello/welcome",
                roles: [],
            }, {
                serverSrl: givenIndex,
                method: givenMethod,
                path: "hello/universe",
                roles: [],
            }];

            // when
            for (const givenEndpoint of givenEndpoints) {
                strategy.upsertEndpoint(givenEndpoint);
            }

            // then
            const tree = (strategy as any).trees[givenIndex];
            expect(tree).toBeDefined();
            const root = tree.getPath(givenMethod.valueOf());
            expect(root).toBeDefined();
            expect(root.children.size).toBe(1);
            const depth1 = root.children.get("hello");
            expect(depth1).toBeDefined();
            expect(depth1.endpoint).toBeFalsy();
            expect(depth1.hasVariable).toBeFalsy();
            expect(depth1.children.size).toBe(3);
        });

        it("should immediately return if empty path, blank parts given", () => {
            // given
            const givenIndex = 1;
            const givenMethod = EndpointMethod.POST;
            const givenEndpoints: Endpoint[] = [{
                serverSrl: givenIndex,
                method: givenMethod,
                path: "",
                roles: [],
            }, {
                serverSrl: givenIndex,
                method: givenMethod,
                path: "hello//world",
                roles: [],
            }];

            // when
            for (const givenEndpoint of givenEndpoints) {
                strategy.upsertEndpoint(givenEndpoint);
            }

            // then
            const tree = (strategy as any).trees[givenIndex];
            expect(tree).toBeUndefined();
        });
    });

    describe("match", () => {
        const givenEndpoints: Endpoint[] = [{
            serverSrl: 1,
            method: EndpointMethod.GET,
            path: "hello/world",
            roles: [],
        }, {
            serverSrl: 1,
            method: EndpointMethod.GET,
            path: "hello/:srl/yes",
            roles: [],
        }, {
            serverSrl: 1,
            method: EndpointMethod.GET,
            path: "hello/welcome",
            roles: [],
        }];

        beforeEach(() => {
            for (const givenEndpoint of givenEndpoints) {
                strategy.upsertEndpoint(givenEndpoint);
            }
        });


        it("should be matched if inserted case given", () => {
            // given
            const givenEndpoint = givenEndpoints[0];

            // when
            const actualIsMatch = strategy.match(givenEndpoint.serverSrl, givenEndpoint.method, givenEndpoint.path);

            // then
            expect(actualIsMatch).toBeTruthy();
        });

        it("should be matched if proper variable given", () => {
            // given
            const givenEndpoint = givenEndpoints[1];
            const givenPath = "hello/123/yes"

            // when
            const actualIsMatch = strategy.match(givenEndpoint.serverSrl, givenEndpoint.method, givenPath);

            // then
            expect(actualIsMatch).toBeTruthy();
        });

        it("should be not matched if proper variable but child part is invalid", () => {
            // given
            const givenEndpoint = givenEndpoints[1];
            const givenPath = "hello/123/no"

            // when
            const actualIsMatch = strategy.match(givenEndpoint.serverSrl, givenEndpoint.method, givenPath);

            // then
            expect(actualIsMatch).toBeFalsy();
        });

        it("should be not matched if not provided index given", () => {
            // given
            const givenIndex = 10;
            const givenEndpoint = givenEndpoints[0];

            // when
            const actualIsMatch = strategy.match(givenIndex, givenEndpoint.method, givenEndpoint.path);

            // then
            expect(actualIsMatch).toBeFalsy();
        });

        it("should be not matched if not provided method given", () => {
            // given
            const givenMethod = EndpointMethod.DELETE;
            const givenEndpoint = givenEndpoints[0];

            // when
            const actualIsMatch = strategy.match(givenEndpoint.serverSrl, givenMethod, givenEndpoint.path);

            // then
            expect(actualIsMatch).toBeFalsy();
        });

        it("should be not matched if not provided long path given", () => {
            // given
            const givenPath = "hello/world/welcome";
            const givenEndpoint = givenEndpoints[0];

            // when
            const actualIsMatch = strategy.match(givenEndpoint.serverSrl, givenEndpoint.method, givenPath);

            // then
            expect(actualIsMatch).toBeFalsy();
        });

        it("should be not matched if not provided short path given", () => {
            // given
            const givenPath = "hello";
            const givenEndpoint = givenEndpoints[0];

            // when
            const actualIsMatch = strategy.match(givenEndpoint.serverSrl, givenEndpoint.method, givenPath);

            // then
            expect(actualIsMatch).toBeFalsy();
        });

        it("should be not matched if empty path given", () => {
            // given
            const givenPath = "";
            const givenEndpoint = givenEndpoints[0];

            // when
            const actualIsMatch = strategy.match(givenEndpoint.serverSrl, givenEndpoint.method, givenPath);

            // then
            expect(actualIsMatch).toBeFalsy();
        });
    });

});
