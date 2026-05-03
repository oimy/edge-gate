import {EndpointAccessStrategy} from "@/service/endpoint/access/strategy";
import {Endpoint, EndpointMethod} from "@/service/endpoint/models";
import {EndpointRoleCache} from "@/service/endpoint/access/cache";

export class RoleBaseEndpointAccessStrategy implements EndpointAccessStrategy {
    private cache: EndpointRoleCache = new EndpointRoleCache();

    verify(method: EndpointMethod, path: string, userRoleNames: string[]): boolean {
        const endpointRoleNames: Set<string> | undefined = this.cache.get(method, path);
        if (!endpointRoleNames) {
            return false;
        }
        return userRoleNames.some(roleName => endpointRoleNames.has(roleName));
    }

    upsertEndpoint(endpoint: Endpoint): void {
        this.cache.set(endpoint);
    }

    upsertEndpoints(endpoints: Endpoint[]): void {
        endpoints.forEach(this.cache.set);
    }
}