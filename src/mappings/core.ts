/* eslint-disable prefer-const */
import { Bundle, Pool, Token, Factory, Mint, Burn, Swap, Tick } from '../types/schema'
import { BigDecimal, BigInt, log, store } from '@graphprotocol/graph-ts'
import { Mint as MintEvent, Burn as BurnEvent, Swap as SwapEvent, Initialize } from '../types/templates/Pool/Pool'
import { convertTokenToDecimal, loadTransaction } from '../utils'
import { FACTORY_ADDRESS, ONE_BI, ZERO_BD, ZERO_BI } from '../utils/constants'
import { findEthPerToken, getEthPriceInUSD, sqrtPriceX96ToTokenPrices } from '../utils/pricing'
import { updateUniswapDayData, updatePoolDayData, updateTokenDayData } from '../utils/intervalUpdates'
import { createTick, feeTierToTickSpacing } from '../utils/tick'

export function handleInitialize(event: Initialize): void {
  let pool = Pool.load(event.address.toHexString())
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.tick = BigInt.fromI32(event.params.tick)
  // token prices
  let prices = sqrtPriceX96ToTokenPrices(pool.sqrtPrice)
  pool.token0Price = prices[0]
  pool.token1Price = prices[1]
  pool.save()

  // update ETH price now that prices could have changed
  let bundle = Bundle.load('1')
  bundle.ethPriceUSD = getEthPriceInUSD()
  bundle.save()

  updatePoolDayData(event)

  // update token prices
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)
  token0.derivedETH = findEthPerToken(token0 as Token)
  token1.derivedETH = findEthPerToken(token1 as Token)
  token0.save()
  token1.save()
}

export function handleMint(event: MintEvent): void {
  let bundle = Bundle.load('1')
  let poolAddress = event.address.toHexString()
  let pool = Pool.load(poolAddress)
  let factory = Factory.load(FACTORY_ADDRESS)

  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  let amountUSD = amount0
    .times(token0.derivedETH.times(bundle.ethPriceUSD))
    .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)))

  // reset tvl aggregates until new amounts calculated
  factory.totalValueLockedETH = factory.totalValueLockedETH.minus(pool.totalValueLockedETH)

  // update globals
  factory.txCount = factory.txCount.plus(ONE_BI)

  // update token0 data
  token0.txCount = token0.txCount.plus(ONE_BI)
  token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
  token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH.times(bundle.ethPriceUSD))

  // update token1 data
  token1.txCount = token1.txCount.plus(ONE_BI)
  token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
  token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH.times(bundle.ethPriceUSD))

  // pool data
  pool.txCount = pool.txCount.plus(ONE_BI)

  // Pools liquidity tracks the currently active liquidity given pools current tick. 
  // We only want to update it on mint if the new position includes the current tick.
  if (pool.tick !== null && BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) && BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)) {
    pool.liquidity = pool.liquidity.plus(event.params.amount)
  }

  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
  pool.totalValueLockedETH = pool.totalValueLockedToken0
    .times(token0.derivedETH)
    .plus(pool.totalValueLockedToken1.times(token1.derivedETH))
  pool.totalValueLockedUSD = pool.totalValueLockedETH.times(bundle.ethPriceUSD)

  // reset aggregates with new amounts
  factory.totalValueLockedETH = factory.totalValueLockedETH.plus(pool.totalValueLockedETH)
  factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)

  let transaction = loadTransaction(event)
  let mint = new Mint(transaction.id.toString() + '#' + pool.txCount.toString())
  mint.transaction = transaction.id
  mint.timestamp = transaction.timestamp
  mint.pool = pool.id
  mint.owner = event.params.owner
  mint.sender = event.params.sender
  mint.origin = event.transaction.from
  mint.amount = event.params.amount
  mint.amount0 = amount0
  mint.amount1 = amount1
  mint.amountUSD = amountUSD
  mint.tickLower = BigInt.fromI32(event.params.tickLower)
  mint.tickUpper = BigInt.fromI32(event.params.tickUpper)
  mint.logIndex = event.logIndex

  // tick entities
  let lowerTickIdx = event.params.tickLower
  let upperTickIdx = event.params.tickUpper

  let lowerTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickLower).toString()
  let upperTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickUpper).toString()
  
  let lowerTick = Tick.load(lowerTickId)
  let upperTick = Tick.load(upperTickId)
  
  if (lowerTick === null) {
    lowerTick = createTick(lowerTickId, lowerTickIdx, pool.id, event)
  }

  if (upperTick === null) {
    upperTick = createTick(upperTickId, upperTickIdx, pool.id, event)
  }

  let amount = event.params.amount
  lowerTick.liquidityGross = lowerTick.liquidityGross.plus(amount)
  lowerTick.liquidityNet = lowerTick.liquidityNet.plus(amount)
  upperTick.liquidityGross = upperTick.liquidityGross.plus(amount)
  upperTick.liquidityNet = upperTick.liquidityNet.minus(amount)

  // TODO: Update Tick's volume, fees, and liquidity provider count. Computing these on the tick
  // level requires reimplementing some of the swapping code from v3-core.

  updateUniswapDayData(event)
  updatePoolDayData(event)
  updateTokenDayData(token0 as Token, event)
  updateTokenDayData(token1 as Token, event)

  token0.save()
  token1.save()
  pool.save()
  factory.save()
  mint.save()
  lowerTick.save()
  upperTick.save()
}

export function handleBurn(event: BurnEvent): void {
  let bundle = Bundle.load('1')
  let poolAddress = event.address.toHexString()
  let pool = Pool.load(poolAddress)
  let factory = Factory.load(FACTORY_ADDRESS)

  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  let amountUSD = amount0
    .times(token0.derivedETH.times(bundle.ethPriceUSD))
    .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)))

  // reset tvl aggregates until new amounts calculated
  factory.totalValueLockedETH = factory.totalValueLockedETH.minus(pool.totalValueLockedETH)

  // update globals
  factory.txCount = factory.txCount.plus(ONE_BI)

  // update token0 data
  token0.txCount = token0.txCount.plus(ONE_BI)
  token0.totalValueLocked = token0.totalValueLocked.minus(amount0)
  token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH.times(bundle.ethPriceUSD))

  // update token1 data
  token1.txCount = token1.txCount.plus(ONE_BI)
  token1.totalValueLocked = token1.totalValueLocked.minus(amount1)
  token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH.times(bundle.ethPriceUSD))

  // pool data
  pool.txCount = pool.txCount.plus(ONE_BI)
  // Pools liquidity tracks the currently active liquidity given pools current tick. 
  // We only want to update it on burn if the position being burnt includes the current tick.
  if (pool.tick !== null && BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) && BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)) {
    pool.liquidity = pool.liquidity.minus(event.params.amount)
  }

  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(amount1)
  pool.totalValueLockedETH = pool.totalValueLockedToken0
    .times(token0.derivedETH)
    .plus(pool.totalValueLockedToken1.times(token1.derivedETH))
  pool.totalValueLockedUSD = pool.totalValueLockedETH.times(bundle.ethPriceUSD)

  // reset aggregates with new amounts
  factory.totalValueLockedETH = factory.totalValueLockedETH.plus(pool.totalValueLockedETH)
  factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)

  // burn entity
  let transaction = loadTransaction(event)
  let burn = new Burn(transaction.id + '#' + pool.txCount.toString())
  burn.transaction = transaction.id
  burn.timestamp = transaction.timestamp
  burn.pool = pool.id
  burn.owner = event.params.owner
  burn.origin = event.transaction.from
  burn.amount = event.params.amount
  burn.amount0 = amount0
  burn.amount1 = amount1
  burn.amountUSD = amountUSD
  burn.tickLower = BigInt.fromI32(event.params.tickLower)
  burn.tickUpper = BigInt.fromI32(event.params.tickUpper)
  burn.logIndex = event.logIndex

  // tick entities
  let lowerTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickLower).toString()
  let upperTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickUpper).toString()
  let lowerTick = Tick.load(lowerTickId)
  let upperTick = Tick.load(upperTickId)
  let amount = event.params.amount
  lowerTick.liquidityGross = lowerTick.liquidityGross.minus(amount)
  lowerTick.liquidityNet = lowerTick.liquidityNet.minus(amount)
  upperTick.liquidityGross = upperTick.liquidityGross.minus(amount)
  upperTick.liquidityNet = upperTick.liquidityNet.plus(amount)

  updateUniswapDayData(event)
  updatePoolDayData(event)
  updateTokenDayData(token0 as Token, event)
  updateTokenDayData(token1 as Token, event)

  // If liquidity gross is zero then there are no positions starting at or ending at the tick.
  // It is now safe to remove the tick from the data store.
  if (lowerTick.liquidityGross.equals(ZERO_BI)) {
    store.remove('Tick', lowerTickId);
  } else {
    lowerTick.save()
  }

  if (upperTick.liquidityGross.equals(ZERO_BI)) {
    store.remove('Tick', upperTickId);
  } else {
    upperTick.save()
  }

  token0.save()
  token1.save()
  pool.save()
  factory.save()
  burn.save()
}

export function handleSwap(event: SwapEvent): void {
  let bundle = Bundle.load('1')
  let factory = Factory.load(FACTORY_ADDRESS)
  let pool = Pool.load(event.address.toHexString())
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)

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
  /**
   * @todo
   * need to account for if either amount is more reliable
   */
  let amountTotalETH = amount0ETH.plus(amount1ETH).div(BigDecimal.fromString('2'))
  let amountTotalUSD = amount0USD.plus(amount1USD).div(BigDecimal.fromString('2'))

  // global updates
  factory.txCount = factory.txCount.plus(ONE_BI)
  factory.totalVolumeETH = factory.totalVolumeETH.plus(amount0ETH).plus(amount1ETH)
  factory.totalVolumeUSD = factory.totalVolumeUSD.plus(amountTotalUSD)

  // reset aggregate tvl before individual pool tvl updates
  let currentPoolTvlETH = pool.totalValueLockedETH
  let currentPoolTvlUSD = currentPoolTvlETH.times(bundle.ethPriceUSD)
  factory.totalValueLockedETH = factory.totalValueLockedETH.minus(currentPoolTvlETH)
  factory.totalValueLockedUSD = factory.totalValueLockedUSD.minus(currentPoolTvlUSD)

  // pool volume
  pool.volumeToken0 = pool.volumeToken0.plus(amount0)
  pool.volumeToken1 = pool.volumeToken1.plus(amount1)
  pool.volumeUSD = pool.volumeUSD.plus(amountTotalUSD)
  pool.txCount = pool.txCount.plus(ONE_BI)

  // Update the pools active liquidity. 
  // A swap can cause the currently active tick to change, which can cause a change in the active liquidity.
  let previousTick = pool.tick
  let newTick = BigInt.fromI32(event.params.tick)
  let tickSpacing = feeTierToTickSpacing(pool.feeTier)
  // Snap to the previous initializable tick (i.e. a multiple of fee spacing)
  let previousActiveTick: BigInt = previousTick.div(tickSpacing).times(tickSpacing)
  let newActiveTick: BigInt = newTick.div(tickSpacing).times(tickSpacing)

  // If our new tick is bigger, we check all initializable ticks up to and including the new tick, and apply their net liquidities.
  if (previousTick.le(newTick)) {
    for (let activeTick = previousActiveTick.plus(tickSpacing); activeTick.le(newActiveTick); activeTick = activeTick.plus(tickSpacing)) {
      let activeTickId = pool.id + "#" + activeTick.toString()
      let activeTickLoaded = Tick.load(activeTickId)
  
      if (activeTickLoaded) {
        pool.liquidity = pool.liquidity.plus(activeTickLoaded.liquidityNet)
      }
    }
  } else {
    // Our new tick is smaller. We don't want to apply net liquidity until we have passed the tick with the net.
    // e.g. if our new tick = 200, and 200 has net liquidity, we *don't* want to apply 200's net liquidity yet (since 200s liquidity)
    // is still active.
    let previousActiveTickIter = ZERO_BI.plus(previousActiveTick)
    for (let activeTick = previousActiveTickIter.minus(tickSpacing); activeTick.ge(newActiveTick); activeTick = activeTick.minus(tickSpacing)) {
      let previousActiveTickId = pool.id + "#" + previousActiveTickIter.toString()
      let activeTickLoaded = Tick.load(previousActiveTickId)
      if (activeTickLoaded) {
        pool.liquidity = pool.liquidity.minus(activeTickLoaded.liquidityNet)
      }
      previousActiveTickIter = activeTick
    }
  }
  
  // Update the pools tick
  pool.tick = BigInt.fromI32(event.params.tick as i32)
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)


  // update token0 data
  token0.volume = token0.volume.plus(amount0Abs)
  token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
  token0.volumeUSD = token0.volumeUSD.plus(amountTotalUSD)

  // update token1 data
  token1.volume = token1.volume.plus(amount1Abs)
  token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
  token1.volumeUSD = token1.volumeUSD.plus(amountTotalUSD)

  // updated pool rates
  let prices = sqrtPriceX96ToTokenPrices(pool.sqrtPrice)
  pool.token0Price = prices[0]
  pool.token1Price = prices[1]
  pool.save()

  // update eth price
  bundle.ethPriceUSD = getEthPriceInUSD()
  bundle.save()

  // update token derived rates
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
  swap.sender = event.params.sender
  swap.origin = event.transaction.from
  swap.recipient = event.params.recipient
  swap.amount0 = amount0
  swap.amount1 = amount1
  swap.amountUSD = amountTotalUSD
  swap.tick = BigInt.fromI32(event.params.tick as i32)
  swap.sqrtPriceX96 = event.params.sqrtPriceX96
  swap.logIndex = event.logIndex

  // interval data
  let uniswapDayData = updateUniswapDayData(event)
  let poolDayData = updatePoolDayData(event)
  let token0DayData = updateTokenDayData(token0 as Token, event)
  let token1DayData = updateTokenDayData(token1 as Token, event)

  // update volume metrics
  uniswapDayData.volumeETH = uniswapDayData.volumeETH.plus(amountTotalETH)
  uniswapDayData.volumeUSD = uniswapDayData.volumeUSD.plus(amountTotalUSD)

  poolDayData.volumeUSD = poolDayData.volumeUSD.plus(amountTotalUSD)
  poolDayData.volumeToken0 = poolDayData.volumeToken0.plus(amount0Abs)
  poolDayData.volumeToken1 = poolDayData.volumeToken1.plus(amount1Abs)

  token0DayData.volume = token0DayData.volume.plus(amount0Abs)
  token0DayData.volumeUSD = token0DayData.volumeUSD.plus(amountTotalUSD)
  token0DayData.untrackedVolumeUSD = token0DayData.untrackedVolumeUSD.plus(amountTotalUSD)

  token1DayData.volume = token1DayData.volume.plus(amount1Abs)
  token1DayData.volumeUSD = token1DayData.volumeUSD.plus(amountTotalUSD)
  token1DayData.untrackedVolumeUSD = token1DayData.untrackedVolumeUSD.plus(amountTotalUSD)

  token0DayData.save()
  token1DayData.save()
  uniswapDayData.save()
  poolDayData.save()
  factory.save()
  pool.save()
  token0.save()
  token1.save()
}
