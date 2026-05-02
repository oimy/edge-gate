import {ServerSupplyStrategy} from "@/service/server/supply/strategy";
import {apiConfig} from "@/configuration/api.config";
import {Server} from "@/service/server/models";

const GET_FETCH_OPTIONS: RequestInit = {
    method: "GET",
} as const;

export class SimpleServerSupplyStrategy implements ServerSupplyStrategy {
    private readonly apiBaseUrl: string = apiConfig.authApiBaseUrl;

    async supply(): Promise<Server[]> {
        const url = `${this.apiBaseUrl}/server/servers`;
        const res: Response = await fetch(url, GET_FETCH_OPTIONS);
        if (!res.ok) {
            console.error("failed to fetch servers");
            return [];
        }
        const data = await res.json();
        if (!this.isValidServersType(data)) {
            console.error("invalid data format received from api");
            return [];
        }
        return data;
    }

    private isValidServersType(data: any): data is Server[] {
        if (!Array.isArray(data)) return false;
        if (data.length === 0) return true;

        return data.every((item: any) => {
            if (typeof item.name !== "string") return false;
            if (typeof item.version !== "number") return false;
            return typeof item.url === "string";
        });
    }

}