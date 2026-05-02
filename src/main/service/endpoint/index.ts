import {EndpointAccessStrategy} from "@/service/endpoint/access/strategy";
import {RoleBaseEndpointAccessStrategy} from "@/service/endpoint/access/strategies/role-base.strategy";
import {EndpointSupplyStrategy} from "@/service/endpoint/supply/strategy";
import {TimeBaseEndpointSupplyStrategy} from "@/service/endpoint/supply/strategies/time-base.strategy";

const accessStrategy: EndpointAccessStrategy = new RoleBaseEndpointAccessStrategy();
const supplyStrategy: EndpointSupplyStrategy = new TimeBaseEndpointSupplyStrategy();

export const getEndpointAccessStrategy = () => accessStrategy;
export const getEndpointSupplyStrategy = () => supplyStrategy;