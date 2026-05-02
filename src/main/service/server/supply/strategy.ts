import {Server} from "@/service/server/models";

export interface ServerSupplyStrategy {

    supply(): Promise<Server[]>;

}