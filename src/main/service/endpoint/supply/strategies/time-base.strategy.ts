import {Endpoint} from "@/service/endpoint/models";
import {EndpointSupplyStrategy} from "@/service/endpoint/supply/strategy";
import {apiConfig} from "@/configuration/api.config";

const GET_FETCH_OPTIONS: RequestInit = {
    method: "GET",
} as const;

export class TimeBaseEndpointSupplyStrategy implements EndpointSupplyStrategy {
    private readonly apiBaseUrl: string = apiConfig.authApiBaseUrl;
    private lastCheckedTime: Date = new Date(1990, 0, 1);

    async supply(): Promise<Endpoint[]> {
        const currentCheckedTime = new Date();
        const paramMap = {
            afterModifiedAt: this.lastCheckedTime.toISOString(),
        };

        const query: string = new URLSearchParams(paramMap).toString();
        const url = `${this.apiBaseUrl}/server/role-endpoints?${query}`;
        const res: Response = await fetch(url, GET_FETCH_OPTIONS);
        if (!res.ok) {
            console.error("failed to fetch endpoints");
            return [];
        }
        const data = await res.json();
        if (!this.isValidEndpointsType(data)) {
            console.error("invalid data format received from api");
            return [];
        }
        this.lastCheckedTime = currentCheckedTime;
        return data;
    }

    private isValidEndpointsType(data: any): data is Endpoint[] {
        if (!Array.isArray(data)) return false;
        if (data.length === 0) return true;

        return data.every((item: any) => {
            if (typeof item.serverSrl !== "number") return false;
            if (typeof item.method !== "string") return false;
            if (typeof item.path !== "string") return false;
            if (!Array.isArray(item.roles)) return false;
            if (item.roles.length === 0) return true;
            return typeof item.roles[0].name === "string";
        });
    }
}