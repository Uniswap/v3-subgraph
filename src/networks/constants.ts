/* eslint-disable prefer-const */
import { BigDecimal } from '@graphprotocol/graph-ts'

export let FACTORY_ADDRESS = '0x1f98431c8ad98523631ae4a59f267346ea31f984'
export let WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

// used for safe eth pricing 
export let STABLE_POOL_ADDRESS = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8'

// tokens where USD value is safe to use for globals
export let WHITELIST_TOKENS: string[] = [
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', //WETH
  '0x6b175474e89094c44da98b954eedeac495271d0f', //DAI
]

// used for safe eth pricing 
export let STABLE_COINS: string[] = [
  '0x6b175474e89094c44da98b954eedeac495271d0f', //DAI
]

// minimum eth required in pool to count usd values towards global prices 
export let MINIMUM_ETH_LOCKED = BigDecimal.fromString('0.5')

// pool that breaks with subgraph logic 
export let ERROR_POOL = '0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248'
