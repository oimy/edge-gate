import {Endpoint, EndpointMethod} from "@/service/endpoint/models";

export interface EndpointMatchStrategy {

    match(serverSrl: number, method: EndpointMethod, path: string): Endpoint | undefined;

    upsertEndpoint(endpoint: Endpoint): void;

}