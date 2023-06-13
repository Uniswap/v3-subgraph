/* eslint-disable prefer-const */
import { ONE_BD, ZERO_BD, ZERO_BI } from './constants'
import { Bundle, Pool, Token } from './../types/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { exponentToBigDecimal, safeDiv } from '../utils/index'

const WAVAX_ADDRESS = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
const WAVAX_USDC_03_POOL = '0x1b323f29f54461a7b61B7e66F1a93E4cDe032167'

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export let WHITELIST_TOKENS: string[] = [
  WAVAX_ADDRESS, // WAVAX
  '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', // DAI.e
  '0xbA7dEebBFC5fA1100Fb055a87773e1E99Cd3507a', // DAI
  '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', // USDC.e
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
  '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', // USDT.e
  '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDt
  '0x130966628846BFd36ff31a822705796e8cb8C18D', // MIM
]

let STABLE_COINS: string[] = [
  '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', // DAI.e
  '0xbA7dEebBFC5fA1100Fb055a87773e1E99Cd3507a', // DAI
  '0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664', // USDC.e
  '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC
  '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', // USDT.e
  '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', // USDt
]

let MINIMUM_ETH_LOCKED = BigDecimal.fromString('60')

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

export function getEthPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let usdcPool = Pool.load(WAVAX_USDC_03_POOL)
  if (usdcPool !== null) {
    return usdcPool.token0Price
  } else {
    return ZERO_BD
  }
}

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(token: Token): BigDecimal {
  if (token.id == WAVAX_ADDRESS) {
    return ONE_BD
  }
  let whiteList = token.whitelistPools
  // for now just take USD from pool with greatest TVL
  // need to update this to actually detect best rate based on liquidity distribution
  let largestLiquidityETH = ZERO_BD
  let priceSoFar = ZERO_BD
  let bundle = Bundle.load('1')

  // hardcoded fix for incorrect rates
  // if whitelist includes token - get the safe price
  if (STABLE_COINS.includes(token.id)) {
    priceSoFar = safeDiv(ONE_BD, bundle.ethPriceUSD)
  } else {
    for (let i = 0; i < whiteList.length; ++i) {
      let poolAddress = whiteList[i]
      let pool = Pool.load(poolAddress)

      if (pool.liquidity.gt(ZERO_BI)) {
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
  let price0USD = token0.derivedETH.times(bundle.ethPriceUSD)
  let price1USD = token1.derivedETH.times(bundle.ethPriceUSD)

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
