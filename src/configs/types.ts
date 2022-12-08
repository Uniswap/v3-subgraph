export interface NetworkConfig {
    "network_name": string,
    "start_block": number,
    "no_graft": boolean,
    "graft_id"?: string,
    "graft_block"?: number,
    "should_backfill": boolean,
    "factory_address": string,
    "manager_address": string,
    "weth_address": string,
    "stable_pool_address": string,
    "whitelist_tokens": {address: string, blurb: string}[],
    "stabelcoins": {address: string, blurb: string}[],
    "stableIsToken0": boolean,
    "min_eth": number,
    "error_pool"?: string
}