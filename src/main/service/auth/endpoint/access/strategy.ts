import {Endpoint, EndpointMethod} from "@/service/auth/endpoint/models";


export interface EndpointAccessStrategy {

    verify(method: EndpointMethod, path: string, userRoleNames: string[]): boolean;

    updateEndpoint(endpoint: Endpoint): void;

    updateEndpoints(endpoints: Endpoint[]): void;

}