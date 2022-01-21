/* eslint-disable prefer-const */
import { BigDecimal } from '@graphprotocol/graph-ts'

export let FACTORY_ADDRESS = '{{factory_address}}'
export let WETH_ADDRESS = '{{weth_address}}'



// tokens where USD value is safe to use for globals
export let WHITELIST_TOKENS: string[] = [
  {{#whitelist_tokens}}
  '{{address}}', //{{blurb}}
  {{/whitelist_tokens}}
]

// used for safe eth pricing 
export let STABLE_COINS: string[] = [
  {{#stabelcoins}}
  '{{address}}', //{{blurb}}
  {{/stabelcoins}}
]

// used for safe eth pricing 
export let STABLE_POOL_ADDRESS = '{{stable_pool_address}}'

// determines which token to use for eth<-> rate, true means stable is token0 in pool above 
export let STABLE_IS_TOKEN_0 = {{stableIsToken0}}

// minimum eth required in pool to count usd values towards global prices 
export let MINIMUM_ETH_LOCKED = BigDecimal.fromString('{{min_eth}}')

// pool that breaks with subgraph logic 
export let ERROR_POOL = '{{error_pool}}'
