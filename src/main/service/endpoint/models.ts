export interface Role {
    name: string;
}

export enum EndpointMethod {
    GET = 0, POST = 1, PUT = 2, DELETE = 3, PATCH = 4
}

export interface Endpoint {
    serverSrl: number;
    method: EndpointMethod;
    path: string;
    roles: Role[];
}