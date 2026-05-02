import {Endpoint} from "@/service/endpoint/models";


export interface EndpointSupplyStrategy {

    supply(): Promise<Endpoint[]>;

}