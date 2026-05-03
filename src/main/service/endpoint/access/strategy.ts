import {Endpoint, EndpointMethod} from "@/service/endpoint/models";


export interface EndpointAccessStrategy {

    verify(method: EndpointMethod, path: string, userRoleNames: string[]): boolean;

    upsertEndpoint(endpoint: Endpoint): void;

    upsertEndpoints(endpoints: Endpoint[]): void;

}