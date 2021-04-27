/* eslint-disable prefer-const */
import { ONE_BD, ZERO_BD } from './constants'
import { Pool, Token } from './../types/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

let Q192 = 2 ** 192
export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  let denom = BigDecimal.fromString(Q192.toString())
  let price1 = num.div(denom)
  let price0 = BigDecimal.fromString('1').div(price1)
  return [price0, price1]
}

const WETH_ADDRESS = '0xc778417e063141139fce010982780140aa0cd5ab'
const DAI_WETH_03_POOL = '0x8ffb36fe19aaa22bf11f6a4f3dbcd4ae13842a67'

export function getEthPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let daiPool = Pool.load(DAI_WETH_03_POOL) // dai is token1
  if (daiPool !== null) {
    return daiPool.token1Price
  } else {
    return ZERO_BD
  }
}

// token where amounts should contribute to tracked volume and liquidity
// let FEE_LEVELS_BIPS: number[] = [500, 3000, 10000]

// token where amounts should contribute to tracked volume and liquidity
export let WHITELIST_TOKENS: string[] = [
  WETH_ADDRESS, // WETH
  '0xc7ad46e0b8a400bb3c915120d284aafba8fc4735' // DAI
]

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(token: Token): BigDecimal {
  if (token.id == WETH_ADDRESS) {
    return ONE_BD
  }
  let whiteList = token.whitelistPools
  for (let i = 0; i < whiteList.length; ++i) {
    let poolAddress = whiteList[i]
    let pool = Pool.load(poolAddress)
    if (pool.token0 == token.id) {
      let token1 = Token.load(pool.token1)
      // token1 per our token * Eth per token1
      return pool.token1Price.times(token1.derivedETH as BigDecimal)
    }
    if (pool.token1 == token.id) {
      let token0 = Token.load(pool.token0)
      // token0 per our token * ETH per token0
      return pool.token0Price.times(token0.derivedETH as BigDecimal)
    }
  }
  return ZERO_BD // nothing was found return 0
}
