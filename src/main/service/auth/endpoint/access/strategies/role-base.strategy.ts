import {EndpointAccessStrategy} from "@/service/auth/endpoint/access/strategy";
import {Endpoint, EndpointMethod} from "@/service/auth/endpoint/models";
import {EndpointRoleCache} from "@/service/auth/endpoint/access/cache";

class RoleBaseEndpointAccessStrategy implements EndpointAccessStrategy {
    private cache: EndpointRoleCache = new EndpointRoleCache();

    verify(method: EndpointMethod, path: string, userRoleNames: string[]): boolean {
        const endpointRoleNames: Set<string> | undefined = this.cache.get(method, path);
        if (!endpointRoleNames) {
            return false;
        }
        return userRoleNames.some(roleName => endpointRoleNames.has(roleName));
    }

    updateEndpoint(endpoint: Endpoint): void {
        this.cache.set(endpoint);
    }

    updateEndpoints(endpoints: Endpoint[]): void {
        endpoints.forEach(this.cache.set);
    }

}