/* eslint-disable prefer-const */
import { Address, BigDecimal, BigInt, Bytes, TypedMap } from '@graphprotocol/graph-ts'

import { Bundle, Pool, Token } from '../../generated/schema'
import { MINIMUM_NATIVE_LOCKED, REFERENCE_TOKEN, STABLE_COINS, STABLE_TOKEN_POOL, WHITELIST_TOKENS } from './chain'
import { ONE_BD, ONE_BI, ZERO_BD, ZERO_BI } from './constants'
import { exponentToBigDecimal, safeDiv } from './utils'

let Q192 = BigInt.fromI32(2).pow(192 as u8)

export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: Token, token1: Token): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  let denom = BigDecimal.fromString(Q192.toString())
  let price1 = safeDiv(
    safeDiv(num, denom).times(exponentToBigDecimal(token0.decimals)),
    exponentToBigDecimal(token1.decimals)
  )

  let price0 = safeDiv(BigDecimal.fromString('1'), price1)
  return [price0, price1]
}

export function getEthPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let stablePool = STABLE_TOKEN_POOL
  // On chains where the reference token is itself a USD stablecoin (e.g. Arc, whose native
  // gas token is USDC and which has no wrapped-native / reference-stable pool), the reference
  // token's USD price is 1 by definition. Such chains opt in by setting
  // STABLE_TOKEN_POOL = REFERENCE_TOKEN in their config.
  if (stablePool == REFERENCE_TOKEN) {
    return ONE_BD
  }
  let usdcPool = Pool.load(Address.fromString(stablePool)) // dai is token0
  if (usdcPool) {
    if (usdcPool.token0 == Address.fromString(REFERENCE_TOKEN)) return usdcPool.token1Price
    else return usdcPool.token0Price
  } else {
    return ZERO_BD
  }
}

export class PricingContext {
  currentPool: Pool
  pools: TypedMap<string, Pool>
  tokens: TypedMap<string, Token>

  constructor(currentPool: Pool, token0: Token, token1: Token) {
    this.currentPool = currentPool
    this.pools = new TypedMap<string, Pool>()
    this.tokens = new TypedMap<string, Token>()
    this.pools.set(currentPool.id.toHexString(), currentPool)
    this.tokens.set(token0.id.toHexString(), token0)
    this.tokens.set(token1.id.toHexString(), token1)
  }

  loadPool(poolAddress: Bytes): Pool | null {
    const key = poolAddress.toHexString()
    const cached = this.pools.get(key)
    if (cached) {
      return cached
    }
    const pool = Pool.load(poolAddress)
    if (pool) {
      this.pools.set(key, pool)
    }
    return pool
  }

  loadToken(tokenAddress: Bytes): Token | null {
    const key = tokenAddress.toHexString()
    const cached = this.tokens.get(key)
    if (cached) {
      return cached
    }
    const token = Token.load(tokenAddress)
    if (token) {
      this.tokens.set(key, token)
    }
    return token
  }
}

class PriceCandidate {
  pool: Pool
  ethLocked: BigDecimal
  price: BigDecimal

  constructor(pool: Pool, ethLocked: BigDecimal, price: BigDecimal) {
    this.pool = pool
    this.ethLocked = ethLocked
    this.price = price
  }
}

function priceCandidate(token: Token, pool: Pool, context: PricingContext): PriceCandidate | null {
  if (!pool.liquidity.gt(ZERO_BI)) {
    return null
  }
  if (pool.token0.equals(token.id)) {
    const pricingToken = context.loadToken(pool.token1)
    if (pricingToken) {
      const ethLocked = pool.totalValueLockedToken1.times(pricingToken.derivedETH)
      if (ethLocked.gt(MINIMUM_NATIVE_LOCKED)) {
        return new PriceCandidate(pool, ethLocked, pool.token1Price.times(pricingToken.derivedETH))
      }
    }
  }
  if (pool.token1.equals(token.id)) {
    const pricingToken = context.loadToken(pool.token0)
    if (pricingToken) {
      const ethLocked = pool.totalValueLockedToken0.times(pricingToken.derivedETH)
      if (ethLocked.gt(MINIMUM_NATIVE_LOCKED)) {
        return new PriceCandidate(pool, ethLocked, pool.token0Price.times(pricingToken.derivedETH))
      }
    }
  }
  return null
}

function poolIndex(pools: Bytes[], poolAddress: Bytes): i32 {
  for (let i = 0; i < pools.length; ++i) {
    if (pools[i].equals(poolAddress)) {
      return i
    }
  }
  return -1
}

function isBetterCandidate(candidate: PriceCandidate, best: PriceCandidate, pools: Bytes[]): boolean {
  if (candidate.ethLocked.gt(best.ethLocked)) {
    return true
  }
  return (
    candidate.ethLocked.equals(best.ethLocked) && poolIndex(pools, candidate.pool.id) < poolIndex(pools, best.pool.id)
  )
}

export function invalidateTokenPricingPool(token: Token, pool: Pool): void {
  if (poolIndex(token.whitelistPools, pool.id) >= 0) {
    token.pricingPool = null
  }
}

function pricingRevision(bundle: Bundle): BigInt {
  return bundle.pricingRevision ? bundle.pricingRevision! : ZERO_BI
}

export function updatePricingRevision(
  bundle: Bundle,
  token0: Token,
  oldToken0DerivedETH: BigDecimal,
  newToken0DerivedETH: BigDecimal,
  token1: Token,
  oldToken1DerivedETH: BigDecimal,
  newToken1DerivedETH: BigDecimal
): void {
  const token0PriceChanged =
    WHITELIST_TOKENS.includes(token0.id.toHexString()) && !oldToken0DerivedETH.equals(newToken0DerivedETH)
  const token1PriceChanged =
    WHITELIST_TOKENS.includes(token1.id.toHexString()) && !oldToken1DerivedETH.equals(newToken1DerivedETH)
  if (token0PriceChanged || token1PriceChanged) {
    bundle.pricingRevision = pricingRevision(bundle).plus(ONE_BI)
  }
}

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(token: Token, bundle: Bundle, context: PricingContext): BigDecimal {
  if (token.id == Address.fromString(REFERENCE_TOKEN)) {
    return ONE_BD
  }
  const whitelistPools = token.whitelistPools
  if (STABLE_COINS.includes(token.id.toHexString())) {
    return safeDiv(ONE_BD, bundle.ethPriceUSD)
  }

  const currentPoolIndex = poolIndex(whitelistPools, context.currentPool.id)
  const cachedPoolAddress = token.pricingPool
  const bundlePricingRevision = pricingRevision(bundle)
  const tokenPricingRevision = token.pricingRevision
  if (
    cachedPoolAddress &&
    tokenPricingRevision &&
    tokenPricingRevision.equals(bundlePricingRevision) &&
    poolIndex(whitelistPools, cachedPoolAddress) >= 0 &&
    !cachedPoolAddress.equals(context.currentPool.id)
  ) {
    const cachedPool = context.loadPool(cachedPoolAddress)
    const cachedCandidate = cachedPool ? priceCandidate(token, cachedPool, context) : null
    if (cachedCandidate) {
      let best = cachedCandidate
      if (currentPoolIndex >= 0) {
        const currentCandidate = priceCandidate(token, context.currentPool, context)
        if (currentCandidate && isBetterCandidate(currentCandidate, best, whitelistPools)) {
          best = currentCandidate
        }
      }
      token.pricingPool = best.pool.id
      token.pricingRevision = bundlePricingRevision
      return best.price
    }
  }

  let best: PriceCandidate | null = null
  for (let i = 0; i < whitelistPools.length; ++i) {
    const pool = context.loadPool(whitelistPools[i])
    const candidate = pool ? priceCandidate(token, pool, context) : null
    if (candidate && (!best || candidate.ethLocked.gt(best.ethLocked))) {
      best = candidate
    }
  }
  token.pricingPool = best ? best.pool.id : null
  token.pricingRevision = bundlePricingRevision
  return best ? best.price : ZERO_BD
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
  bundle: Bundle
): BigDecimal {
  let price0USD = token0.derivedETH.times(bundle.ethPriceUSD)
  let price1USD = token1.derivedETH.times(bundle.ethPriceUSD)

  // both are whitelist tokens, return sum of both amounts
  if (WHITELIST_TOKENS.includes(token0.id.toHexString()) && WHITELIST_TOKENS.includes(token1.id.toHexString())) {
    return tokenAmount0.times(price0USD).plus(tokenAmount1.times(price1USD))
  }

  // take double value of the whitelisted token amount
  if (WHITELIST_TOKENS.includes(token0.id.toHexString()) && !WHITELIST_TOKENS.includes(token1.id.toHexString())) {
    return tokenAmount0.times(price0USD).times(BigDecimal.fromString('2'))
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST_TOKENS.includes(token0.id.toHexString()) && WHITELIST_TOKENS.includes(token1.id.toHexString())) {
    return tokenAmount1.times(price1USD).times(BigDecimal.fromString('2'))
  }

  // neither token is on white list, tracked amount is 0
  return ZERO_BD
}
