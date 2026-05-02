import {Endpoint, EndpointMethod, Role} from "@/service/endpoint/models";

export class EndpointRoleCache {
    private endpointAndRolesMap: Map<string, Set<string>> = new Map();

    private makeEndpointKey(method: EndpointMethod, path: string) {
        return `${method}:${path}`;
    }

    set(endpoint: Endpoint): void {
        const endpointKey: string = this.makeEndpointKey(endpoint.method, endpoint.path);
        const roleNames: Set<string> = new Set(endpoint.roles.map((role: Role) => role.name));
        this.endpointAndRolesMap.set(endpointKey, roleNames);
    }

    get(method: EndpointMethod, path: string): Set<string> | undefined {
        const endpointKey: string = this.makeEndpointKey(method, path);
        return this.endpointAndRolesMap.get(endpointKey);
    }
}