import {EndpointMatchStrategy} from "@/service/endpoint/match/strategy";
import {Endpoint, EndpointMethod} from "../../models";

class PathNode {
    children: Map<string, PathNode> = new Map();
    hasVariable: boolean = false;
    endpoint: Endpoint | undefined = undefined;
}

class PathTree {
    private nodes: PathNode[] = new Array<PathNode>(8);

    getPath(index: number): PathNode | undefined {
        return this.nodes[index];
    }

    setPath(index: number, path: PathNode): PathNode {
        this.nodes[index] = path;
        return path;
    }
}

const VARIABLE = "@var";

export class TreeEndpointMatchStrategy implements EndpointMatchStrategy {
    private trees: PathTree[] = new Array<PathTree>(128);

    match(index: number, method: EndpointMethod, path: string): Endpoint | undefined {
        const parts: string[] = path.split('/');
        if (parts.length === 0 || parts.some(part => !part)) {
            return undefined;
        }

        const tree: PathTree | undefined = this.trees[index];
        if (!tree) return undefined;
        let node: PathNode | undefined = tree.getPath(method.valueOf());
        if (!node) return undefined;

        for (const part of parts) {
            const childNode: PathNode | undefined = node.children.get(part);
            if (childNode) {
                node = childNode;
                continue;
            }
            if (node.hasVariable) {
                node = node.children.get(VARIABLE);
                if (!node) return undefined;
                continue;
            }
            return undefined;
        }
        return node.endpoint;
    }

    insert(endpoint: Endpoint): void {
        const parts: string[] = endpoint.path.split('/');
        if (parts.length === 0 || parts.some(part => !part)) {
            return;
        }
        const tree: PathTree = this.trees[endpoint.serverSrl] ?? (this.trees[endpoint.serverSrl] = new PathTree());
        let node: PathNode = tree.getPath(endpoint.method.valueOf()) ??
            (tree.setPath(endpoint.method.valueOf(), new PathNode()));

        for (const part of parts) {
            let childNode: PathNode | undefined = node.children.get(part);
            let partName = part;
            if (part.startsWith(":")) {
                node.hasVariable = true;
                partName = VARIABLE;
            }
            if (!childNode) {
                childNode = new PathNode();
                node.children.set(partName, childNode);
            }
            node = childNode;
        }
        node.endpoint = endpoint;
    }

}