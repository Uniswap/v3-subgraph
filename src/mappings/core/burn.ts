/* eslint-disable prefer-const */
import { Bundle, Factory, Pool, Burn, Token } from '../../types/schema'
import { BigInt } from '@graphprotocol/graph-ts'
import { Burn as BurnEvent } from '../../types/templates/Pool/Pool'
import { convertTokenToDecimal, loadTransaction } from '../../utils'
import { FACTORY_ADDRESS, ONE_BI } from '../../utils/constants'
import { updateDerivedTVLAmounts } from '../../utils/tvl'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateTokenHourData,
  updateUniswapDayData
} from '../../utils/intervalUpdates'

export function handleBurn(event: BurnEvent): void {
  let bundle = Bundle.load('1')
  let poolAddress = event.address.toHexString()
  let pool = Pool.load(poolAddress)
  let factory = Factory.load(FACTORY_ADDRESS)

  // Parse amounts.
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  let amountUSD = amount0
    .times(token0.derivedETH.times(bundle.ethPriceUSD))
    .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)))

  // Transaction count updates.
  token0.txCount = token0.txCount.plus(ONE_BI)
  token1.txCount = token1.txCount.plus(ONE_BI)
  pool.txCount = pool.txCount.plus(ONE_BI)
  factory.txCount = factory.txCount.plus(ONE_BI)

  // Update TVL values.
  let oldPoolTotalValueLockedETH = pool.totalValueLockedETH
  let oldPoolTVLETHUntracked = pool.totalValueLockedETHUntracked
  token0.totalValueLocked = token0.totalValueLocked.minus(amount0)
  token1.totalValueLocked = token1.totalValueLocked.minus(amount1)
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(amount1)
  updateDerivedTVLAmounts(pool as Pool, factory as Factory, oldPoolTotalValueLockedETH, oldPoolTVLETHUntracked)

  // Pools liquidity tracks the currently active liquidity given pools current tick.
  // We only want to update it on burn if the position being burnt includes the current tick.
  if (
    pool.tick !== null &&
    BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
    BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
  ) {
    pool.liquidity = pool.liquidity.minus(event.params.amount)
  }

  // Burn entities.
  let transaction = loadTransaction(event)
  let burn = new Burn(transaction.id + '#' + pool.txCount.toString())
  burn.transaction = transaction.id
  burn.timestamp = transaction.timestamp
  burn.pool = pool.id
  burn.token0 = pool.token0
  burn.token1 = pool.token1
  burn.owner = event.params.owner
  burn.origin = event.transaction.from
  burn.amount = event.params.amount
  burn.amount0 = amount0
  burn.amount1 = amount1
  burn.amountUSD = amountUSD
  burn.tickLower = BigInt.fromI32(event.params.tickLower)
  burn.tickUpper = BigInt.fromI32(event.params.tickUpper)
  burn.logIndex = event.logIndex

  updateUniswapDayData(event)
  updatePoolDayData(event)
  updatePoolHourData(event)
  updateTokenDayData(token0 as Token, event)
  updateTokenDayData(token1 as Token, event)
  updateTokenHourData(token0 as Token, event)
  updateTokenHourData(token1 as Token, event)

  token0.save()
  token1.save()
  pool.save()
  factory.save()
  burn.save()
}
