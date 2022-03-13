/* eslint-disable prefer-const */
import { Bundle, Factory, Pool, Swap, Token } from '../../types/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Swap as SwapEvent } from '../../types/templates/Pool/Pool'
import { convertTokenToDecimal, loadTransaction } from '../../utils'
import { FACTORY_ADDRESS, ONE_BI, TWO_BD, ZERO_BD } from '../../utils/constants'
import {
  AmountType,
  findEthPerToken,
  getAdjustedAmounts,
  getEthPriceInUSD,
  sqrtPriceX96ToTokenPrices
} from '../../utils/pricing'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateTokenHourData,
  updateUniswapDayData
} from '../../utils/intervalUpdates'
import { updateDerivedTVLAmounts } from '../../utils/tvl'

export function handleSwap(event: SwapEvent): void {
  let bundle = Bundle.load('1')
  let factory = Factory.load(FACTORY_ADDRESS)
  let pool = Pool.load(event.address.toHexString())
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)

  // Hot fix for bad pricing.
  if (pool.id == '0x9663f2ca0454accad3e094448ea6f77443880454') {
    return
  }

  // Amounts - 0/1 are token deltas: can be positive or negative.
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  // Calculate volume amounts. Need to divide derived amounts by 2 so volume is not counted on both sides of swap.
  let amount0Abs = amount0.times(BigDecimal.fromString(amount0.lt(ZERO_BD) ? '-1' : '1'))
  let amount1Abs = amount1.times(BigDecimal.fromString(amount1.lt(ZERO_BD) ? '-1' : '1'))
  let volumeAmounts: AmountType = getAdjustedAmounts(amount0Abs, token0 as Token, amount1Abs, token1 as Token)
  let volumeETH = volumeAmounts.eth.div(TWO_BD)
  let volumeUSD = volumeAmounts.usd.div(TWO_BD)
  let volumeUSDUntracked = volumeAmounts.usdUntracked.div(TWO_BD)

  // Fee amounts.
  let feesETH = volumeETH.times(pool.feeTier.toBigDecimal()).div(BigDecimal.fromString('1000000'))
  let feesUSD = volumeUSD.times(pool.feeTier.toBigDecimal()).div(BigDecimal.fromString('1000000'))

  // Update transaction counts.
  factory.txCount = factory.txCount.plus(ONE_BI)
  pool.txCount = pool.txCount.plus(ONE_BI)
  token0.txCount = token0.txCount.plus(ONE_BI)
  token1.txCount = token1.txCount.plus(ONE_BI)

  // Update fees.
  factory.feesETH = factory.feesETH.plus(feesETH)
  factory.feesUSD = factory.feesUSD.plus(feesUSD)
  pool.feesUSD = pool.feesUSD.plus(feesUSD)
  token0.feesUSD = token0.feesUSD.plus(feesUSD)
  token1.feesUSD = token1.feesUSD.plus(feesUSD)

  // Updates volume.
  factory.volumeETH = factory.volumeETH.plus(volumeETH)
  factory.volumeUSD = factory.volumeUSD.plus(volumeUSD)
  factory.volumeUSDUntracked = factory.volumeUSDUntracked.plus(volumeUSDUntracked)
  pool.volumeToken0 = pool.volumeToken0.plus(amount0Abs)
  pool.volumeToken1 = pool.volumeToken1.plus(amount1Abs)
  pool.volumeUSD = pool.volumeUSD.plus(volumeUSD)
  pool.volumeUSDUntracked = pool.volumeUSDUntracked.plus(volumeUSDUntracked)
  token0.volume = token0.volume.plus(amount0Abs)
  token0.volumeUSD = token0.volumeUSD.plus(volumeUSD)
  token0.volumeUSDUntracked = token0.volumeUSDUntracked.plus(volumeUSDUntracked)
  token1.volume = token1.volume.plus(amount1Abs)
  token1.volumeUSD = token1.volumeUSD.plus(volumeUSD)
  token1.volumeUSDUntracked = token1.volumeUSDUntracked.plus(volumeUSDUntracked)

  // Update the pool with the new active liquidity, price, and tick.
  pool.liquidity = event.params.liquidity
  pool.tick = BigInt.fromI32(event.params.tick as i32)
  pool.sqrtPrice = event.params.sqrtPriceX96

  // Update pool specific values
  let prices = sqrtPriceX96ToTokenPrices(pool.sqrtPrice, token0 as Token, token1 as Token)
  pool.token0Price = prices[0]
  pool.token1Price = prices[1]
  pool.save()

  // Update USD pricing.
  bundle.ethPriceUSD = getEthPriceInUSD()
  bundle.save()
  token0.derivedETH = findEthPerToken(token0 as Token)
  token1.derivedETH = findEthPerToken(token1 as Token)

  // Update TVL values.
  let oldPoolTVLETH = pool.totalValueLockedETH
  let oldPoolTVLETHUntracked = pool.totalValueLockedETHUntracked
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
  token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
  token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
  updateDerivedTVLAmounts(pool as Pool, factory as Factory, oldPoolTVLETH, oldPoolTVLETHUntracked)

  // Create Swap event.
  let transaction = loadTransaction(event)
  let swap = new Swap(transaction.id + '#' + pool.txCount.toString())
  swap.transaction = transaction.id
  swap.timestamp = transaction.timestamp
  swap.pool = pool.id
  swap.token0 = pool.token0
  swap.token1 = pool.token1
  swap.sender = event.params.sender
  swap.origin = event.transaction.from
  swap.recipient = event.params.recipient
  swap.amount0 = amount0
  swap.amount1 = amount1
  swap.amountUSD = volumeUSD
  swap.tick = BigInt.fromI32(event.params.tick as i32)
  swap.sqrtPriceX96 = event.params.sqrtPriceX96
  swap.logIndex = event.logIndex

  // Sync inetrval entities with udpated state.
  let uniswapDayData = updateUniswapDayData(event)
  let poolDayData = updatePoolDayData(event)
  let poolHourData = updatePoolHourData(event)
  let token0DayData = updateTokenDayData(token0 as Token, event)
  let token1DayData = updateTokenDayData(token1 as Token, event)
  let token0HourData = updateTokenHourData(token0 as Token, event)
  let token1HourData = updateTokenHourData(token1 as Token, event)

  // Add volume updates to interval entities.
  uniswapDayData.volumeETH = uniswapDayData.volumeETH.plus(volumeETH)
  uniswapDayData.volumeUSD = uniswapDayData.volumeUSD.plus(volumeUSD)
  uniswapDayData.feesUSD = uniswapDayData.feesUSD.plus(feesUSD)

  poolDayData.volumeUSD = poolDayData.volumeUSD.plus(volumeUSD)
  poolDayData.volumeToken0 = poolDayData.volumeToken0.plus(amount0Abs)
  poolDayData.volumeToken1 = poolDayData.volumeToken1.plus(amount1Abs)
  poolDayData.feesUSD = poolDayData.feesUSD.plus(feesUSD)

  poolHourData.volumeUSD = poolHourData.volumeUSD.plus(volumeUSD)
  poolHourData.volumeToken0 = poolHourData.volumeToken0.plus(amount0Abs)
  poolHourData.volumeToken1 = poolHourData.volumeToken1.plus(amount1Abs)
  poolHourData.feesUSD = poolHourData.feesUSD.plus(feesUSD)

  token0DayData.volume = token0DayData.volume.plus(amount0Abs)
  token0DayData.volumeUSD = token0DayData.volumeUSD.plus(volumeUSD)
  token0DayData.volumeUSDUntracked = token0DayData.volumeUSDUntracked.plus(volumeUSDUntracked)
  token0DayData.feesUSD = token0DayData.feesUSD.plus(feesUSD)

  token0HourData.volume = token0HourData.volume.plus(amount0Abs)
  token0HourData.volumeUSD = token0HourData.volumeUSD.plus(volumeUSD)
  token0HourData.volumeUSDUntracked = token0HourData.volumeUSDUntracked.plus(volumeUSDUntracked)
  token0HourData.feesUSD = token0HourData.feesUSD.plus(feesUSD)

  token1DayData.volume = token1DayData.volume.plus(amount1Abs)
  token1DayData.volumeUSD = token1DayData.volumeUSD.plus(volumeUSD)
  token1DayData.volumeUSDUntracked = token1DayData.volumeUSDUntracked.plus(volumeUSDUntracked)
  token1DayData.feesUSD = token1DayData.feesUSD.plus(feesUSD)

  token1HourData.volume = token1HourData.volume.plus(amount1Abs)
  token1HourData.volumeUSD = token1HourData.volumeUSD.plus(volumeUSD)
  token1HourData.volumeUSDUntracked = token1HourData.volumeUSDUntracked.plus(volumeUSDUntracked)
  token1HourData.feesUSD = token1HourData.feesUSD.plus(feesUSD)

  // Save entities.
  swap.save()
  factory.save()
  uniswapDayData.save()
  pool.save()
  poolDayData.save()
  poolHourData.save()
  token0.save()
  token1.save()
  token0DayData.save()
  token1DayData.save()
  token0HourData.save()
  token1HourData.save()
}
