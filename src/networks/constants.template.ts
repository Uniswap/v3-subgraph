/* eslint-disable prefer-const */
import { BigDecimal } from '@graphprotocol/graph-ts'

export const WETH_ADDRESS = "{{weth_address}}"
export const STABLE_POOL_ADDRESS = "{{stable_pool_address}}"
export const WHITELIST_TOKENS: string[] = [
  {{#whitelist_tokens}}
    "{{address}}", //{{blurb}}
  {{/whitelist_tokens}}
]
export let STABLE_COINS: string[] = [
  {{#stabelcoins}}
    "{{address}}", //{{blurb}}
  {{/stabelcoins}}
]
export let MINIMUM_ETH_LOCKED = BigDecimal.fromString('{{min_eth}}')
