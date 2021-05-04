/* eslint-disable prefer-const */
import { ONE_BD, ZERO_BD } from './constants'
import { Pool, Token } from './../types/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { exponentToBigDecimal } from '../utils/index'

let Q192 = 2 ** 192
export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: Token, token1: Token): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  let denom = BigDecimal.fromString(Q192.toString())
  let price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0.decimals))
    .div(exponentToBigDecimal(token1.decimals))

  let price0 = BigDecimal.fromString('1').div(price1)

  return [price0, price1]
}

const WETH_ADDRESS = '0xc778417e063141139fce010982780140aa0cd5ab'
const DAI_WETH_03_POOL = '0x62fc2179597e23321cc2a77b1a77b72c98f5e1a5'

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
export let WHITELIST_TOKENS: string[] = [
  WETH_ADDRESS, // WETH
  '0xc7ad46e0b8a400bb3c915120d284aafba8fc4735' // DAI
]

let MINIMUM_ETH_LOCKED = BigDecimal.fromString('1.5')

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(token: Token): BigDecimal {
  if (token.id == WETH_ADDRESS) {
    return ONE_BD
  }
  let whiteList = token.whitelistPools
  // for now just take USD from pool with greatest TVL
  // need to update this to actually detect best rate based on liquidity distribution
  let largestLiquidityETH = ZERO_BD
  let priceSoFar = ZERO_BD

  for (let i = 0; i < whiteList.length; ++i) {
    let poolAddress = whiteList[i]
    let pool = Pool.load(poolAddress)
    if (pool.token0 == token.id) {
      // whitelist token is token1
      let token1 = Token.load(pool.token1)
      // get the derived ETH in pool
      let ethLocked = pool.totalValueLockedToken1.times(token1.derivedETH)
      if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(MINIMUM_ETH_LOCKED)) {
        largestLiquidityETH = ethLocked
        // token1 per our token * Eth per token1
        priceSoFar = pool.token1Price.times(token1.derivedETH as BigDecimal)
      }
    }
    if (pool.token1 == token.id) {
      let token0 = Token.load(pool.token0)
      // get the derived ETH in pool
      let ethLocked = pool.totalValueLockedToken0.times(token0.derivedETH)
      if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(MINIMUM_ETH_LOCKED)) {
        largestLiquidityETH = ethLocked
        // token0 per our token * ETH per token0
        priceSoFar = pool.token0Price.times(token0.derivedETH as BigDecimal)
      }
    }
  }
  return priceSoFar // nothing was found return 0
}
