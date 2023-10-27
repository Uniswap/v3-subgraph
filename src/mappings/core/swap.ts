import { Bundle, Factory, Pool, Swap, Token,  } from '../../types/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Pool as PoolABI } from '../types/Factory/Pool'
import { ZERO_BI } from '../utils/constants'
import { Swap as SwapEvent } from '../../types/templates/Pool/Pool'
import { convertTokenToDecimal, loadTransaction } from '../../utils'
import { FACTORY_ADDRESS, ONE_BI, ZERO_BD } from '../../utils/constants'
import {
    findEthPerToken, getEthPriceInUSD, getTrackedAmountUSD, sqrtPriceX96ToTokenPrices
} from '../../utils/pricing'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateTokenHourData,
  updateUniswapDayData
} from '../../utils/intervalUpdates'
import { updateDerivedTVLAmounts } from '../../utils/tvl'
import { feeTierToTickSpacing } from '../utils/tick'


export function handleSwap(event: SwapEvent): void {
    let bundle = Bundle.load('1')
    let factory = Factory.load(FACTORY_ADDRESS)
    let pool = Pool.load(event.address.toHexString())
  
    // hot fix for bad pricing
    if (pool.id == '0x9663f2ca0454accad3e094448ea6f77443880454') {
      return
    }
  
    let token0 = Token.load(pool.token0)
    let token1 = Token.load(pool.token1)
  
    let oldTick = pool.tick!
  
    // amounts - 0/1 are token deltas: can be positive or negative
    let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
    let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  
    // need absolute amounts for volume
    let amount0Abs = amount0
    if (amount0.lt(ZERO_BD)) {
      amount0Abs = amount0.times(BigDecimal.fromString('-1'))
    }
    let amount1Abs = amount1
    if (amount1.lt(ZERO_BD)) {
      amount1Abs = amount1.times(BigDecimal.fromString('-1'))
    }
  
    let amount0ETH = amount0Abs.times(token0.derivedETH)
    let amount1ETH = amount1Abs.times(token1.derivedETH)
    let amount0USD = amount0ETH.times(bundle.ethPriceUSD)
    let amount1USD = amount1ETH.times(bundle.ethPriceUSD)
  
    // get amount that should be tracked only - div 2 because cant count both input and output as volume
    let amountTotalUSDTracked = getTrackedAmountUSD(amount0Abs, token0 as Token, amount1Abs, token1 as Token).div(
      BigDecimal.fromString('2')
    )
    let amountTotalETHTracked = safeDiv(amountTotalUSDTracked, bundle.ethPriceUSD)
    let amountTotalUSDUntracked = amount0USD.plus(amount1USD).div(BigDecimal.fromString('2'))
  
    let feesETH = amountTotalETHTracked.times(pool.feeTier.toBigDecimal()).div(BigDecimal.fromString('1000000'))
    let feesUSD = amountTotalUSDTracked.times(pool.feeTier.toBigDecimal()).div(BigDecimal.fromString('1000000'))
  
    // global updates
    factory.txCount = factory.txCount.plus(ONE_BI)
    factory.totalVolumeETH = factory.totalVolumeETH.plus(amountTotalETHTracked)
    factory.totalVolumeUSD = factory.totalVolumeUSD.plus(amountTotalUSDTracked)
    factory.untrackedVolumeUSD = factory.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
    factory.totalFeesETH = factory.totalFeesETH.plus(feesETH)
    factory.totalFeesUSD = factory.totalFeesUSD.plus(feesUSD)
  
    // reset aggregate tvl before individual pool tvl updates
    let currentPoolTvlETH = pool.totalValueLockedETH
    factory.totalValueLockedETH = factory.totalValueLockedETH.minus(currentPoolTvlETH)
  
    // pool volume
    pool.volumeToken0 = pool.volumeToken0.plus(amount0Abs)
    pool.volumeToken1 = pool.volumeToken1.plus(amount1Abs)
    pool.volumeUSD = pool.volumeUSD.plus(amountTotalUSDTracked)
    pool.untrackedVolumeUSD = pool.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
    pool.feesUSD = pool.feesUSD.plus(feesUSD)
    pool.txCount = pool.txCount.plus(ONE_BI)
  
    // Update the pool with the new active liquidity, price, and tick.
    pool.liquidity = event.params.liquidity
    pool.tick = BigInt.fromI32(event.params.tick as i32)
    pool.sqrtPrice = event.params.sqrtPriceX96
    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
  
    // update token0 data
    token0.volume = token0.volume.plus(amount0Abs)
    token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
    token0.volumeUSD = token0.volumeUSD.plus(amountTotalUSDTracked)
    token0.untrackedVolumeUSD = token0.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
    token0.feesUSD = token0.feesUSD.plus(feesUSD)
    token0.txCount = token0.txCount.plus(ONE_BI)
  
    // update token1 data
    token1.volume = token1.volume.plus(amount1Abs)
    token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
    token1.volumeUSD = token1.volumeUSD.plus(amountTotalUSDTracked)
    token1.untrackedVolumeUSD = token1.untrackedVolumeUSD.plus(amountTotalUSDUntracked)
    token1.feesUSD = token1.feesUSD.plus(feesUSD)
    token1.txCount = token1.txCount.plus(ONE_BI)
  
    // updated pool ratess
    let prices = sqrtPriceX96ToTokenPrices(pool.sqrtPrice, token0 as Token, token1 as Token)
    pool.token0Price = prices[0]
    pool.token1Price = prices[1]
    pool.save()
  
    // update USD pricing
    bundle.ethPriceUSD = getEthPriceInUSD()
    bundle.save()
    token0.derivedETH = findEthPerToken(token0 as Token)
    token1.derivedETH = findEthPerToken(token1 as Token)
  
    /**
     * Things afffected by new USD rates
     */
    pool.totalValueLockedETH = pool.totalValueLockedToken0
      .times(token0.derivedETH)
      .plus(pool.totalValueLockedToken1.times(token1.derivedETH))
    pool.totalValueLockedUSD = pool.totalValueLockedETH.times(bundle.ethPriceUSD)
  
    factory.totalValueLockedETH = factory.totalValueLockedETH.plus(pool.totalValueLockedETH)
    factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)
  
    token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH).times(bundle.ethPriceUSD)
    token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH).times(bundle.ethPriceUSD)
  
    // create Swap event
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
    swap.amountUSD = amountTotalUSDTracked
    swap.tick = BigInt.fromI32(event.params.tick as i32)
    swap.sqrtPriceX96 = event.params.sqrtPriceX96
    swap.logIndex = event.logIndex
  
    // update fee growth
    let poolContract = PoolABI.bind(event.address)
    let feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128()
    let feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal1X128()
    pool.feeGrowthGlobal0X128 = feeGrowthGlobal0X128 as BigInt
    pool.feeGrowthGlobal1X128 = feeGrowthGlobal1X128 as BigInt
  
    // interval data
    let uniswapDayData = updateUniswapDayData(event)
    let poolDayData = updatePoolDayData(event)
    let poolHourData = updatePoolHourData(event)
    let token0DayData = updateTokenDayData(token0 as Token, event)
    let token1DayData = updateTokenDayData(token1 as Token, event)
    let token0HourData = updateTokenHourData(token0 as Token, event)
    let token1HourData = updateTokenHourData(token1 as Token, event)
  
    // update volume metrics
    uniswapDayData.volumeETH = uniswapDayData.volumeETH.plus(amountTotalETHTracked)
    uniswapDayData.volumeUSD = uniswapDayData.volumeUSD.plus(amountTotalUSDTracked)
    uniswapDayData.feesUSD = uniswapDayData.feesUSD.plus(feesUSD)
  
    poolDayData.volumeUSD = poolDayData.volumeUSD.plus(amountTotalUSDTracked)
    poolDayData.volumeToken0 = poolDayData.volumeToken0.plus(amount0Abs)
    poolDayData.volumeToken1 = poolDayData.volumeToken1.plus(amount1Abs)
    poolDayData.feesUSD = poolDayData.feesUSD.plus(feesUSD)
  
    poolHourData.volumeUSD = poolHourData.volumeUSD.plus(amountTotalUSDTracked)
    poolHourData.volumeToken0 = poolHourData.volumeToken0.plus(amount0Abs)
    poolHourData.volumeToken1 = poolHourData.volumeToken1.plus(amount1Abs)
    poolHourData.feesUSD = poolHourData.feesUSD.plus(feesUSD)
  
    token0DayData.volume = token0DayData.volume.plus(amount0Abs)
    token0DayData.volumeUSD = token0DayData.volumeUSD.plus(amountTotalUSDTracked)
    token0DayData.untrackedVolumeUSD = token0DayData.untrackedVolumeUSD.plus(amountTotalUSDTracked)
    token0DayData.feesUSD = token0DayData.feesUSD.plus(feesUSD)
  
    token0HourData.volume = token0HourData.volume.plus(amount0Abs)
    token0HourData.volumeUSD = token0HourData.volumeUSD.plus(amountTotalUSDTracked)
    token0HourData.untrackedVolumeUSD = token0HourData.untrackedVolumeUSD.plus(amountTotalUSDTracked)
    token0HourData.feesUSD = token0HourData.feesUSD.plus(feesUSD)
  
    token1DayData.volume = token1DayData.volume.plus(amount1Abs)
    token1DayData.volumeUSD = token1DayData.volumeUSD.plus(amountTotalUSDTracked)
    token1DayData.untrackedVolumeUSD = token1DayData.untrackedVolumeUSD.plus(amountTotalUSDTracked)
    token1DayData.feesUSD = token1DayData.feesUSD.plus(feesUSD)
  
    token1HourData.volume = token1HourData.volume.plus(amount1Abs)
    token1HourData.volumeUSD = token1HourData.volumeUSD.plus(amountTotalUSDTracked)
    token1HourData.untrackedVolumeUSD = token1HourData.untrackedVolumeUSD.plus(amountTotalUSDTracked)
    token1HourData.feesUSD = token1HourData.feesUSD.plus(feesUSD)
  
    swap.save()
    token0DayData.save()
    token1DayData.save()
    uniswapDayData.save()
    poolDayData.save()
    token0HourData.save()
    token1HourData.save()
    poolHourData.save()
    factory.save()
    pool.save()
    token0.save()
    token1.save()
  
    // Update inner vars of current or crossed ticks
    let newTick = pool.tick!
    let tickSpacing = feeTierToTickSpacing(pool.feeTier)
    let modulo = newTick.mod(tickSpacing)
    if (modulo.equals(ZERO_BI)) {
      // Current tick is initialized and needs to be updated
      loadTickUpdateFeeVarsAndSave(newTick.toI32(), event)
    }
  
    let numIters = oldTick
      .minus(newTick)
      .abs()
      .div(tickSpacing)
  
    if (numIters.gt(BigInt.fromI32(100))) {
      // In case more than 100 ticks need to be updated ignore the update in
      // order to avoid timeouts. From testing this behavior occurs only upon
      // pool initialization. This should not be a big issue as the ticks get
      // updated later. For early users this error also disappears when calling
      // collect
    } else if (newTick.gt(oldTick)) {
      let firstInitialized = oldTick.plus(tickSpacing.minus(modulo))
      for (let i = firstInitialized; i.le(newTick); i = i.plus(tickSpacing)) {
        loadTickUpdateFeeVarsAndSave(i.toI32(), event)
      }
    } else if (newTick.lt(oldTick)) {
      let firstInitialized = oldTick.minus(modulo)
      for (let i = firstInitialized; i.ge(newTick); i = i.minus(tickSpacing)) {
        loadTickUpdateFeeVarsAndSave(i.toI32(), event)
      }
    }
  }
  
  function updateTickFeeVarsAndSave(tick: Tick, event: ethereum.Event): void {
    let poolAddress = event.address
    // not all ticks are initialized so obtaining null is expected behavior
    let poolContract = PoolABI.bind(poolAddress)
    let tickResult = poolContract.ticks(tick.tickIdx.toI32())
    tick.feeGrowthOutside0X128 = tickResult.value2
    tick.feeGrowthOutside1X128 = tickResult.value3
    tick.save()
  
    updateTickDayData(tick!, event)
  }
  
  function loadTickUpdateFeeVarsAndSave(tickId: i32, event: ethereum.Event): void {
    let poolAddress = event.address
    let tick = Tick.load(
      poolAddress
        .toHexString()
        .concat('#')
        .concat(tickId.toString())
    )
    if (tick !== null) {
      updateTickFeeVarsAndSave(tick!, event)
    }
  }