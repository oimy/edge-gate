import {TreeEndpointMatchStrategy} from "@/service/endpoint/match/strategies/tree.strategy";
import {EndpointMatchStrategy} from "@/service/endpoint/match/strategy";
import {EndpointMethod} from "@/service/endpoint/models";

jest.mock("@/service/endpoint/access/cache");

interface EndpointMatchTestCase {
    index: number;
    method: EndpointMethod;
    path: string;
}

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
            const givenCases: EndpointMatchTestCase[] = [{
                index: givenIndex,
                method: givenMethod,
                path: givenPathParts.join("/"),
            }];

            // when
            for (const givenCase of givenCases) {
                strategy.insert(givenCase.index, givenCase.method, givenCase.path);
            }

            // then
            const tree = (strategy as any).trees[givenIndex];
            expect(tree).toBeDefined();
            const root = tree.getPath(givenMethod.valueOf());
            expect(root).toBeDefined();
            expect(root.children.size).toBe(1);
            const depth1 = root.children.get(givenPathParts[0]);
            expect(depth1).toBeDefined();
            expect(depth1.isEnd).toBeFalsy();
            expect(depth1.hasVariable).toBeFalsy();
            expect(depth1.children.size).toBe(1);
            const depth2 = depth1.children.get(givenPathParts[1]);
            expect(depth2).toBeDefined();
            expect(depth2.isEnd).toBeTruthy();
            expect(depth2.hasVariable).toBeFalsy();
        });

        it("should be variable if path variable (start with :) given", () => {
            // given
            const givenIndex = 2;
            const givenMethod = EndpointMethod.GET;
            const givenPathParts = ["hello", ":world", "yes"];
            const givenCases: EndpointMatchTestCase[] = [{
                index: givenIndex,
                method: givenMethod,
                path: givenPathParts.join("/"),
            }];

            // when
            for (const givenCase of givenCases) {
                strategy.insert(givenCase.index, givenCase.method, givenCase.path);
            }

            // then
            const tree = (strategy as any).trees[givenIndex];
            expect(tree).toBeDefined();
            const root = tree.getPath(givenMethod.valueOf());
            expect(root).toBeDefined();
            expect(root.children.size).toBe(1);
            const depth1 = root.children.get(givenPathParts[0]);
            expect(depth1).toBeDefined();
            expect(depth1.isEnd).toBeFalsy();
            expect(depth1.hasVariable).toBeTruthy();
            expect(depth1.children.size).toBe(1);
            const depth2 = depth1.children.get("@var");
            expect(depth2).toBeDefined();
            expect(depth2.isEnd).toBeFalsy();
            expect(depth2.hasVariable).toBeFalsy();
            expect(depth2.children.size).toBe(1);
            const depth3 = depth2.children.get(givenPathParts[2]);
            expect(depth3).toBeDefined();
            expect(depth3.isEnd).toBeTruthy();
            expect(depth3.hasVariable).toBeFalsy();
            expect(depth3.children.size).toBe(0);
        });

        it("should has 3 branches if 3 test cases with same index and method", () => {
            // given
            const givenIndex = 1;
            const givenMethod = EndpointMethod.POST;
            const givenCases: EndpointMatchTestCase[] = [{
                index: givenIndex,
                method: givenMethod,
                path: "hello/world",
            }, {
                index: givenIndex,
                method: givenMethod,
                path: "hello/welcome",
            }, {
                index: givenIndex,
                method: givenMethod,
                path: "hello/universe",
            }];

            // when
            for (const givenCase of givenCases) {
                strategy.insert(givenCase.index, givenCase.method, givenCase.path);
            }

            // then
            const tree = (strategy as any).trees[givenIndex];
            expect(tree).toBeDefined();
            const root = tree.getPath(givenMethod.valueOf());
            expect(root).toBeDefined();
            expect(root.children.size).toBe(1);
            const depth1 = root.children.get("hello");
            expect(depth1).toBeDefined();
            expect(depth1.isEnd).toBeFalsy();
            expect(depth1.hasVariable).toBeFalsy();
            expect(depth1.children.size).toBe(3);
        });

        it("should immediately return if empty path, blank parts given", () => {
            // given
            const givenIndex = 1;
            const givenMethod = EndpointMethod.POST;
            const givenCases: EndpointMatchTestCase[] = [{
                index: givenIndex,
                method: givenMethod,
                path: "",
            }, {
                index: givenIndex,
                method: givenMethod,
                path: "hello//world",
            }];

            // when
            for (const givenCase of givenCases) {
                strategy.insert(givenCase.index, givenCase.method, givenCase.path);
            }

            // then
            const tree = (strategy as any).trees[givenIndex];
            expect(tree).toBeUndefined();
        });
    });

    describe("match", () => {
        const givenCases = [{
            index: 1,
            method: EndpointMethod.GET,
            path: "hello/world",
        }, {
            index: 1,
            method: EndpointMethod.GET,
            path: "hello/:srl/yes",
        }, {
            index: 1,
            method: EndpointMethod.GET,
            path: "hello/welcome",
        }];

        beforeEach(() => {
            for (const givenCase of givenCases) {
                strategy.insert(givenCase.index, givenCase.method, givenCase.path);
            }
        });


        it("should be matched if inserted case given", () => {
            // given
            const givenCase = givenCases[0];

            // when
            const actualIsMatch = strategy.match(givenCase.index, givenCase.method, givenCase.path);

            // then
            expect(actualIsMatch).toBeTruthy();
        });

        it("should be matched if proper variable given", () => {
            // given
            const givenCase = givenCases[1];
            const givenPath = "hello/123/yes"

            // when
            const actualIsMatch = strategy.match(givenCase.index, givenCase.method, givenPath);

            // then
            expect(actualIsMatch).toBeTruthy();
        });

        it("should be not matched if proper variable but child part is invalid", () => {
            // given
            const givenCase = givenCases[1];
            const givenPath = "hello/123/no"

            // when
            const actualIsMatch = strategy.match(givenCase.index, givenCase.method, givenPath);

            // then
            expect(actualIsMatch).toBeFalsy();
        });

        it("should be not matched if not provided index given", () => {
            // given
            const givenIndex = 10;
            const givenCase = givenCases[0];

            // when
            const actualIsMatch = strategy.match(givenIndex, givenCase.method, givenCase.path);

            // then
            expect(actualIsMatch).toBeFalsy();
        });

        it("should be not matched if not provided method given", () => {
            // given
            const givenMethod = EndpointMethod.DELETE;
            const givenCase = givenCases[0];

            // when
            const actualIsMatch = strategy.match(givenCase.index, givenMethod, givenCase.path);

            // then
            expect(actualIsMatch).toBeFalsy();
        });

        it("should be not matched if not provided long path given", () => {
            // given
            const givenPath = "hello/world/welcome";
            const givenCase = givenCases[0];

            // when
            const actualIsMatch = strategy.match(givenCase.index, givenCase.method, givenPath);

            // then
            expect(actualIsMatch).toBeFalsy();
        });

        it("should be not matched if not provided short path given", () => {
            // given
            const givenPath = "hello";
            const givenCase = givenCases[0];

            // when
            const actualIsMatch = strategy.match(givenCase.index, givenCase.method, givenPath);

            // then
            expect(actualIsMatch).toBeFalsy();
        });

        it("should be not matched if empty path given", () => {
            // given
            const givenPath = "";
            const givenCase = givenCases[0];

            // when
            const actualIsMatch = strategy.match(givenCase.index, givenCase.method, givenPath);

            // then
            expect(actualIsMatch).toBeFalsy();
        });
    });

});
