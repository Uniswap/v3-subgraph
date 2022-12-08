/* eslint-disable prefer-const */
import { BigDecimal } from '@graphprotocol/graph-ts'

export let FACTORY_ADDRESS = '0x1f98431c8ad98523631ae4a59f267346ea31f984'
export let WETH_ADDRESS = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'

// tokens where USD value is safe to use for globals
export let WHITELIST_TOKENS: string[] = [
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', //WETH
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', //WMATIC
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', //USDC
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063', //DAI
]

// used for safe eth pricing 
export let STABLE_COINS: string[] = [
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', //USDC
]

// used for safe eth pricing 
export const STABLE_POOL_ADDRESS = '0x0e44ceb592acfc5d3f09d996302eb4c499ff8c10'

// determines which token to use for eth<-> rate, true means stable is token0 in pool above 
export const STABLE_IS_TOKEN_0 = true

// minimum eth required in pool to count usd values towards global prices 
export const MINIMUM_ETH_LOCKED = BigDecimal.fromString('1')

// pool that breaks with subgraph logic 
export const ERROR_POOL = ''
