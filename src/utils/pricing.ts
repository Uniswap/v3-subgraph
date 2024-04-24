import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { exponentToBigDecimal, safeDiv } from '../utils/index'
import { Bundle, Pool, Token } from './../types/schema'
import { ONE_BD, ZERO_BD, ZERO_BI } from './constants'

export const CELO_NATIVE_ADDRESS = '0x471ece3750da237f93b8e339c536989b8978a438'
export const CUSD_CELO_POOL_ADDRESS = '0x2d70cbabf4d8e61d5317b62cbe912935fd94e0fe'
export const STABLECOIN_IS_TOKEN0 = false

const CUSD_ADDRESS = '0x765de816845861e75a25fca122bb6898b8b1282a'
const BRIDGED_USDC_ADDRESS = '0xef4229c8c3250c675f21bcefa42f58efbff6002a'
const NATIVE_USDC_ADDRESS = '0xceba9300f2b948710d2653dd7b07f33a8b32118c'

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with
export const WHITELIST_TOKENS: string[] = [
  CELO_NATIVE_ADDRESS,
  CUSD_ADDRESS,
  BRIDGED_USDC_ADDRESS,
  NATIVE_USDC_ADDRESS,
  '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73', // CEUR
  '0xe8537a3d056da446677b9e9d6c5db704eaab4787', // CREAL
  '0x46c9757c5497c5b1f2eb73ae79b6b67d119b0b58', // PACT
  '0x17700282592d6917f6a73d0bf8accf4d578c131e', // MOO
  '0x66803fb87abd4aac3cbb3fad7c3aa01f6f3fb207', // Portal Eth
  '0xbaab46e28388d2779e6e31fd00cf0e5ad95e327b', // WBTC
]

export const STABLE_COINS: string[] = [CUSD_ADDRESS, BRIDGED_USDC_ADDRESS, NATIVE_USDC_ADDRESS]

export const MINIMUM_ETH_LOCKED = BigDecimal.fromString('3600')

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
  stablecoinWrappedNativePoolAddress: string = CUSD_CELO_POOL_ADDRESS,
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
  wrappedNativeAddress: string = CELO_NATIVE_ADDRESS,
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
