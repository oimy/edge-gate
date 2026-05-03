import {EndpointMethod} from "@/service/endpoint/models";

export interface Path {
    server: string;
    main: string;
}

export const parsePath = (rawPath: string): Path | null => {
    const versionIndex = rawPath.indexOf('/', 1);
    const mainIndex = rawPath.indexOf('/', versionIndex + 1);
    if (versionIndex < 0 || mainIndex < 0) return null;

    return {
        server: rawPath.substring(1, mainIndex),
        main: rawPath.substring(mainIndex + 1),
    };
};

export const parseMethod = (rawMethod: string): EndpointMethod | undefined => {
    switch (rawMethod) {
        case "GET":
            return EndpointMethod.GET;
        case "POST":
            return EndpointMethod.POST;
        case "PUT":
            return EndpointMethod.PUT;
        case "DELETE":
            return EndpointMethod.DELETE;
        case "PATCH":
            return EndpointMethod.PATCH;
        default:
            return undefined;
    }
};