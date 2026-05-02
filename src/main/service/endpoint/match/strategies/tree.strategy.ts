import {EndpointMatchStrategy} from "@/service/endpoint/match/strategy";
import {EndpointMethod} from "../../models";

class PathNode {
    children: Map<string, PathNode> = new Map();
    isEnd: boolean = false;
    hasVariable: boolean = false;
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

    match(index: number, method: EndpointMethod, path: string): boolean {
        const parts: string[] = path.split('/');
        if (parts.length === 0 || parts.some(part => !part)) {
            return false;
        }

        const tree: PathTree | undefined = this.trees[index];
        if (!tree) return false;
        let node: PathNode | undefined = tree.getPath(method.valueOf());
        if (!node) return false;

        for (const part of parts) {
            const childNode: PathNode | undefined = node.children.get(part);
            if (childNode) {
                node = childNode;
                continue;
            }
            if (node.hasVariable) {
                node = node.children.get(VARIABLE);
                if (!node) return false;
                continue;
            }
            return false;
        }
        return node.isEnd;
    }

    insert(index: number, method: EndpointMethod, path: string): void {
        const parts: string[] = path.split('/');
        if (parts.length === 0 || parts.some(part => !part)) {
            return;
        }
        const tree: PathTree = this.trees[index] ?? (this.trees[index] = new PathTree());
        let node: PathNode = tree.getPath(method.valueOf()) ?? (tree.setPath(method.valueOf(), new PathNode()));

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
        node.isEnd = true;
    }

}