import {ServerSupplyStrategy} from "@/service/server/supply/strategy";
import {SimpleServerSupplyStrategy} from "@/service/server/supply/strategies/simple.strategy";

const supplyStrategy: ServerSupplyStrategy = new SimpleServerSupplyStrategy();
export const getServerSupplyStrategy = () => supplyStrategy;