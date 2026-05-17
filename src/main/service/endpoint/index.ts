import {EndpointAccessStrategy} from "@/service/endpoint/access/strategy";
import {RoleBaseEndpointAccessStrategy} from "@/service/endpoint/access/strategies/role-base.strategy";
import {EndpointSupplyStrategy} from "@/service/endpoint/supply/strategy";
import {TimeBaseEndpointSupplyStrategy} from "@/service/endpoint/supply/strategies/time-base.strategy";
import {EndpointMatchStrategy} from "@/service/endpoint/match/strategy";
import {TreeEndpointMatchStrategy} from "@/service/endpoint/match/strategies/tree.strategy";
import service from "@/service";
import {Endpoint} from "@/service/endpoint/models";

const accessStrategy: EndpointAccessStrategy = new RoleBaseEndpointAccessStrategy();
const supplyStrategy: EndpointSupplyStrategy = new TimeBaseEndpointSupplyStrategy();
const matchStrategy: EndpointMatchStrategy = new TreeEndpointMatchStrategy();
service.addInitializable(async () => {
    const endpoints: Endpoint[] = await supplyStrategy.supply();
    console.debug("endpoints fetched from api :", endpoints.length);
    for (const endpoint of endpoints) {
        accessStrategy.upsertEndpoint(endpoint);
        matchStrategy.upsertEndpoint(endpoint);
    }
});

export const getEndpointAccessStrategy = () => accessStrategy;
export const getEndpointSupplyStrategy = () => supplyStrategy;
export const getEndpointMatchStrategy = () => matchStrategy;