export interface Role {
    name: string;
}

export enum EndpointMethod {
    GET, POST, PUT, DELETE, PATCH
}

export interface Endpoint {
    serverSrl: number;
    method: EndpointMethod;
    path: string;
    roles: Role[];
}