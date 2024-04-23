import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { exponentToBigDecimal, safeDiv } from '../utils/index'
import { Bundle, Pool, Token } from './../types/schema'
import { ONE_BD, ZERO_BD, ZERO_BI } from './constants'

export const WAVAX_ADDRESS = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
export const WAVAX_USDC_05_POOL = '0xfae3f424a0a47706811521e3ee268f00cfb5c45e'
export const STABLECOIN_IS_TOKEN0 = false

const DAI_E_ADDRESS = '0xd586e7f844cea2f87f50152665bcbc2c279d8d70'
const DAI_ADDRESS = '0xba7deebbfc5fa1100fb055a87773e1e99cd3507a'
const USDC_E_ADDRESS = '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664'
const USDC_ADDRESS = '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
const USDT_E_ADDRESS = '0xc7198437980c041c805a1edcba50c1ce5db95118'
const USDT_ADDRESS = '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7'

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [
  WAVAX_ADDRESS,
  DAI_E_ADDRESS,
  DAI_ADDRESS,
  USDC_E_ADDRESS,
  USDC_ADDRESS,
  USDT_E_ADDRESS,
  USDT_ADDRESS,
  '0x130966628846bfd36ff31a822705796e8cb8c18d', // mim
]

export const STABLE_COINS: string[] = [
  DAI_E_ADDRESS,
  DAI_ADDRESS,
  USDC_E_ADDRESS,
  USDC_ADDRESS,
  USDT_E_ADDRESS,
  USDT_ADDRESS,
]

export const MINIMUM_ETH_LOCKED = BigDecimal.fromString('1000')

const Q192 = BigInt.fromI32(2).pow(192 as u8)
export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: Token, token1: Token): BigDecimal[] {
  const num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  const denom = BigDecimal.fromString(Q192.toString())
  const price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0.decimals))
    .div(exponentToBigDecimal(token1.decimals))

  const price0 = safeDiv(BigDecimal.fromString('1'), price1)
  return [price0, price1]
}

export function getEthPriceInUSD(
  stablecoinWrappedNativePoolAddress: string = WAVAX_USDC_05_POOL,
  stablecoinIsToken0: boolean = STABLECOIN_IS_TOKEN0, // true is stablecoin is token0, false if stablecoin is token1
): BigDecimal {
  const stablecoinWrappedNativePool = Pool.load(stablecoinWrappedNativePoolAddress)
  if (stablecoinWrappedNativePool !== null) {
    return stablecoinIsToken0 ? stablecoinWrappedNativePool.token0Price : stablecoinWrappedNativePool.token1Price
  } else {
    return ZERO_BD
  }
}

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(
  token: Token,
  wrappedNativeAddress: string = WAVAX_ADDRESS,
  stablecoinAddresses: string[] = STABLE_COINS,
  minimumEthLocked: BigDecimal = MINIMUM_ETH_LOCKED,
): BigDecimal {
  if (token.id == wrappedNativeAddress) {
    return ONE_BD
  }
  const whiteList = token.whitelistPools
  // for now just take USD from pool with greatest TVL
  // need to update this to actually detect best rate based on liquidity distribution
  let largestLiquidityETH = ZERO_BD
  let priceSoFar = ZERO_BD
  const bundle = Bundle.load('1')!

  // hardcoded fix for incorrect rates
  // if whitelist includes token - get the safe price
  if (stablecoinAddresses.includes(token.id)) {
    priceSoFar = safeDiv(ONE_BD, bundle.ethPriceUSD)
  } else {
    for (let i = 0; i < whiteList.length; ++i) {
      const poolAddress = whiteList[i]
      const pool = Pool.load(poolAddress)

      if (pool) {
        if (pool.liquidity.gt(ZERO_BI)) {
          if (pool.token0 == token.id) {
            // whitelist token is token1
            const token1 = Token.load(pool.token1)
            // get the derived ETH in pool
            if (token1) {
              const ethLocked = pool.totalValueLockedToken1.times(token1.derivedETH)
              if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(minimumEthLocked)) {
                largestLiquidityETH = ethLocked
                // token1 per our token * Eth per token1
                priceSoFar = pool.token1Price.times(token1.derivedETH as BigDecimal)
              }
            }
          }
          if (pool.token1 == token.id) {
            const token0 = Token.load(pool.token0)
            // get the derived ETH in pool
            if (token0) {
              const ethLocked = pool.totalValueLockedToken0.times(token0.derivedETH)
              if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(minimumEthLocked)) {
                largestLiquidityETH = ethLocked
                // token0 per our token * ETH per token0
                priceSoFar = pool.token0Price.times(token0.derivedETH as BigDecimal)
              }
            }
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
  token1: Token,
  whitelistTokens: string[] = WHITELIST_TOKENS,
): BigDecimal {
  const bundle = Bundle.load('1')!
  const price0USD = token0.derivedETH.times(bundle.ethPriceUSD)
  const price1USD = token1.derivedETH.times(bundle.ethPriceUSD)

  // both are whitelist tokens, return sum of both amounts
  if (whitelistTokens.includes(token0.id) && whitelistTokens.includes(token1.id)) {
    return tokenAmount0.times(price0USD).plus(tokenAmount1.times(price1USD))
  }

  // take double value of the whitelisted token amount
  if (whitelistTokens.includes(token0.id) && !whitelistTokens.includes(token1.id)) {
    return tokenAmount0.times(price0USD).times(BigDecimal.fromString('2'))
  }

  // take double value of the whitelisted token amount
  if (!whitelistTokens.includes(token0.id) && whitelistTokens.includes(token1.id)) {
    return tokenAmount1.times(price1USD).times(BigDecimal.fromString('2'))
  }

  // neither token is on white list, tracked amount is 0
  return ZERO_BD
}
