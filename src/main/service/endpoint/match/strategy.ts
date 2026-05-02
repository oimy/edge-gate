import {EndpointMethod} from "@/service/endpoint/models";

export interface EndpointMatchStrategy {

    match(index: number, method: EndpointMethod, path: string): boolean;

    insert(index: number, method: EndpointMethod, path: string): void;

}