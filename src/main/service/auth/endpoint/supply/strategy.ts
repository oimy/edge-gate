import {Endpoint} from "@/service/auth/endpoint/models";


export interface EndpointSupplyStrategy {

    supply(): Promise<Endpoint[]>;

}