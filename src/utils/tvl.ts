/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BigDecimal } from '@graphprotocol/graph-ts'
import { Bundle, Factory, Pool, Token } from '../types/schema'
import { AmountType, getAdjustedAmounts } from './pricing'

/**
 * Updates all dervived TVL values. This includes all ETH and USD
 * TVL metrics for a given pool, as well as in the aggregate factory.
 *
 * NOTE: tokens locked should be updated before this function is called,
 * as this logic starts its calculations based on TVL for token0 and token1
 * in the pool.
 *
 * This function should be used whenever the TVL of tokens changes within a pool.
 * Aka: mint, burn, swap, collect
 *
 * @param pool
 * @param factory
 * @param oldPoolTotalValueLockedETH
 */
export function updateDerivedTVLAmounts(
  pool: Pool,
  factory: Factory,
  oldPoolTotalValueLockedETH: BigDecimal,
  oldPoolTotalValueLockedETHUntracked: BigDecimal
): void {
  let bundle = Bundle.load('1')
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)

  // Update token TVL values.
  token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH.times(bundle.ethPriceUSD))
  token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH.times(bundle.ethPriceUSD))

  // Get tracked and untracked amounts based on tokens in pool.
  let amounts: AmountType = getAdjustedAmounts(
    pool.totalValueLockedToken0,
    token0 as Token,
    pool.totalValueLockedToken1,
    token1 as Token
  )

  // Update pool TVL values.
  pool.totalValueLockedETH = amounts.eth
  pool.totalValueLockedUSD = amounts.usd
  pool.totalValueLockedETHUntracked = amounts.ethUntracked
  pool.totalValueLockedUSDUntracked = amounts.usdUntracked

  /**
   * ----- RESET ------
   * We need to reset factory values before updating with new amounts.
   */
  factory.totalValueLockedETH = factory.totalValueLockedETH.minus(oldPoolTotalValueLockedETH)
  factory.totalValueLockedETHUntracked = factory.totalValueLockedETHUntracked.minus(oldPoolTotalValueLockedETHUntracked)

  // Add new TVL based on pool.
  factory.totalValueLockedETH = factory.totalValueLockedETH.plus(amounts.eth)
  factory.totalValueLockedETHUntracked = factory.totalValueLockedETHUntracked.plus(amounts.ethUntracked)
  factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)
  factory.totalValueLockedUSDUntracked = factory.totalValueLockedETHUntracked.times(bundle.ethPriceUSD)

  // Save entities.
  token0.save()
  token1.save()
  factory.save()
  pool.save()
}
