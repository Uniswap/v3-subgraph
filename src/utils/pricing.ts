/* eslint-disable prefer-const */
import { ONE_BD, ZERO_BD, ZERO_BI } from './constants'
import { Bundle, Pool, Token } from './../types/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { exponentToBigDecimal, safeDiv } from '../utils/index'

const WSYS_ADDRESS = '0x4200000000000000000000000000000000000006'
const USDC_WSYS_03_POOL = '0x8483b9ebd28ab033b2437de79d3348d9ad4dc438'

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export let WHITELIST_TOKENS: string[] = [
  WSYS_ADDRESS, // WSYS
  '0x5de737495fe261cc9d6d32e00196d5e4ef43594d', // dai
  '0xdbb59e294a93487822d1d7e164609cd59d396fb5', // usdc
  '0x4dfc340487bbec780ba8458e614b732d7226ae8f', // usdt
  '0x7189ae0d1f60bbb8f26be96df1fb97ad5e881fdd', // wbtc
  '0x8e59ed2df847ad3d19624480db5b2b3ba27fc9a8', // psys
]

let STABLE_COINS: string[] = [
  '0x5de737495fe261cc9d6d32e00196d5e4ef43594d', // dai
  '0xdbb59e294a93487822d1d7e164609cd59d396fb5', // usdc
  '0x4dfc340487bbec780ba8458e614b732d7226ae8f', // usdt
]

let MINIMUM_SYS_LOCKED = BigDecimal.fromString('60')

let Q192 = 2 ** 192
export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: Token, token1: Token): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  let denom = BigDecimal.fromString(Q192.toString())
  let price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0.decimals))
    .div(exponentToBigDecimal(token1.decimals))

  let price0 = safeDiv(BigDecimal.fromString('1'), price1)
  return [price0, price1]
}

export function getSysPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let usdcPool = Pool.load(USDC_WSYS_03_POOL) // dai is token1
  if (usdcPool !== null) {
    return usdcPool.token1Price
  } else {
    return ZERO_BD
  }
}

/**
 * Search through graph to find derived Sys per token.
 * @todo update to be derived SYS (add stablecoin estimates)
 **/
export function findSysPerToken(token: Token): BigDecimal {
  if (token.id == WSYS_ADDRESS) {
    return ONE_BD
  }
  let whiteList = token.whitelistPools
  // for now just take USD from pool with greatest TVL
  // need to update this to actually detect best rate based on liquidity distribution
  let largestLiquiditySYS = ZERO_BD
  let priceSoFar = ZERO_BD
  let bundle = Bundle.load('1')

  // hardcoded fix for incorrect rates
  // if whitelist includes token - get the safe price
  if (STABLE_COINS.includes(token.id)) {
    priceSoFar = safeDiv(ONE_BD, bundle.sysPriceUSD)
  } else {
    for (let i = 0; i < whiteList.length; ++i) {
      let poolAddress = whiteList[i]
      let pool = Pool.load(poolAddress)

      if (pool.liquidity.gt(ZERO_BI)) {
        if (pool.token0 == token.id) {
          // whitelist token is token1
          let token1 = Token.load(pool.token1)
          // get the derived SYS in pool
          let ethLocked = pool.totalValueLockedToken1.times(token1.derivedSYS)
          if (ethLocked.gt(largestLiquiditySYS) && ethLocked.gt(MINIMUM_SYS_LOCKED)) {
            largestLiquiditySYS = ethLocked
            // token1 per our token * Sys per token1
            priceSoFar = pool.token1Price.times(token1.derivedSYS as BigDecimal)
          }
        }
        if (pool.token1 == token.id) {
          let token0 = Token.load(pool.token0)
          // get the derived SYS in pool
          let ethLocked = pool.totalValueLockedToken0.times(token0.derivedSYS)
          if (ethLocked.gt(largestLiquiditySYS) && ethLocked.gt(MINIMUM_SYS_LOCKED)) {
            largestLiquiditySYS = ethLocked
            // token0 per our token * SYS per token0
            priceSoFar = pool.token0Price.times(token0.derivedSYS as BigDecimal)
          }
        }
      }
    }
  }
  return priceSoFar // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedAmountUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let bundle = Bundle.load('1')
  let price0USD = token0.derivedSYS.times(bundle.sysPriceUSD)
  let price1USD = token1.derivedSYS.times(bundle.sysPriceUSD)

  // both are whitelist tokens, return sum of both amounts
  if (WHITELIST_TOKENS.includes(token0.id) && WHITELIST_TOKENS.includes(token1.id)) {
    return tokenAmount0.times(price0USD).plus(tokenAmount1.times(price1USD))
  }

  // take double value of the whitelisted token amount
  if (WHITELIST_TOKENS.includes(token0.id) && !WHITELIST_TOKENS.includes(token1.id)) {
    return tokenAmount0.times(price0USD).times(BigDecimal.fromString('2'))
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST_TOKENS.includes(token0.id) && WHITELIST_TOKENS.includes(token1.id)) {
    return tokenAmount1.times(price1USD).times(BigDecimal.fromString('2'))
  }

  // neither token is on white list, tracked amount is 0
  return ZERO_BD
}
