import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
/* eslint-disable prefer-const */
import {
  UniswapDayData,
  Factory,
  Pool,
  PoolDayData,
  Token,
  TokenDayData,
  TokenHourData,
  Bundle,
  PoolHourData,
  PoolFiveMinuteData,
  TickDayData,
  Tick,
  TickHourData,
  TickFiveMinuteData
} from './../types/schema'
import { FACTORY_ADDRESS } from './constants'
import { ethereum, log } from '@graphprotocol/graph-ts'

/**
 * Tracks global aggregate data over daily windows
 * @param event
 */
export function updateUniswapDayData(event: ethereum.Event): UniswapDayData {
  let uniswap = Factory.load(FACTORY_ADDRESS)
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400 // rounded
  let dayStartTimestamp = dayID * 86400
  let uniswapDayData = UniswapDayData.load(dayID.toString())
  if (uniswapDayData === null) {
    uniswapDayData = new UniswapDayData(dayID.toString())
    uniswapDayData.date = dayStartTimestamp
    uniswapDayData.volumeETH = ZERO_BD
    uniswapDayData.volumeUSD = ZERO_BD
    uniswapDayData.volumeUSDUntracked = ZERO_BD
    uniswapDayData.feesUSD = ZERO_BD
  }
  uniswapDayData.tvlUSD = uniswap.totalValueLockedUSD
  uniswapDayData.txCount = uniswap.txCount
  uniswapDayData.save()
  return uniswapDayData as UniswapDayData
}

export function updatePoolDayData(event: ethereum.Event): PoolDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(dayID.toString())
  let pool = Pool.load(event.address.toHexString())
  let poolDayData = PoolDayData.load(dayPoolID)
  if (poolDayData === null) {
    poolDayData = new PoolDayData(dayPoolID)
    poolDayData.date = dayStartTimestamp
    poolDayData.pool = pool.id
    // things that dont get initialized always
    poolDayData.volumeToken0 = ZERO_BD
    poolDayData.volumeToken1 = ZERO_BD
    poolDayData.volumeUSD = ZERO_BD
    poolDayData.feesUSD = ZERO_BD
    poolDayData.txCount = ZERO_BI
    poolDayData.feeGrowthGlobal0X128 = ZERO_BI
    poolDayData.feeGrowthGlobal1X128 = ZERO_BI
    poolDayData.open = pool.token0Price
    poolDayData.high = pool.token0Price
    poolDayData.low = pool.token0Price
    poolDayData.close = pool.token0Price
  }

  if (pool.token0Price.gt(poolDayData.high)) {
    poolDayData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolDayData.low)) {
    poolDayData.low = pool.token0Price
  }

  poolDayData.liquidity = pool.liquidity
  poolDayData.sqrtPrice = pool.sqrtPrice
  poolDayData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolDayData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolDayData.token0Price = pool.token0Price
  poolDayData.token1Price = pool.token1Price
  poolDayData.close = pool.token0Price;
  poolDayData.tick = pool.tick
  poolDayData.tvlUSD = pool.totalValueLockedUSD
  poolDayData.txCount = poolDayData.txCount.plus(ONE_BI)
  poolDayData.save()

  return poolDayData as PoolDayData
}

export function updatePoolHourData(event: ethereum.Event): PoolHourData {
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let hourPoolID = event.address
    .toHexString()
    .concat('-')
    .concat(hourIndex.toString())
  let pool = Pool.load(event.address.toHexString())
  let poolHourData = PoolHourData.load(hourPoolID)
  if (poolHourData === null) {
    poolHourData = new PoolHourData(hourPoolID)
    poolHourData.date = hourStartUnix
    poolHourData.pool = pool.id
    // things that dont get initialized always
    poolHourData.volumeToken0 = ZERO_BD
    poolHourData.volumeToken1 = ZERO_BD
    poolHourData.volumeUSD = ZERO_BD
    poolHourData.txCount = ZERO_BI
    poolHourData.feesUSD = ZERO_BD
    poolHourData.feeGrowthGlobal0X128 = ZERO_BI
    poolHourData.feeGrowthGlobal1X128 = ZERO_BI
    poolHourData.open = pool.token0Price
    poolHourData.high = pool.token0Price
    poolHourData.low = pool.token0Price
    poolHourData.close = pool.token0Price
  }

  if (pool.token0Price.gt(poolHourData.high)) {
    poolHourData.high = pool.token0Price
  }
  if (pool.token0Price.lt(poolHourData.low)) {
    poolHourData.low = pool.token0Price
  }

  poolHourData.liquidity = pool.liquidity
  poolHourData.sqrtPrice = pool.sqrtPrice
  poolHourData.token0Price = pool.token0Price
  poolHourData.token1Price = pool.token1Price
  poolHourData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolHourData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolHourData.close = pool.token0Price
  poolHourData.tick = pool.tick
  poolHourData.tvlUSD = pool.totalValueLockedUSD
  poolHourData.txCount = poolHourData.txCount.plus(ONE_BI)
  poolHourData.save()

  return poolHourData as PoolHourData
}

export function updatePoolFiveMinuteData(event: ethereum.Event): PoolFiveMinuteData {
  let timestamp = event.block.timestamp.toI32()
  let fiveMinIndex = timestamp / 300; // get unique 5 min interval within unix history
  let periodStartUnix = fiveMinIndex * 300; // want the rounded effect
  let fiveMinPoolId = event.address
    .toHexString()
    .concat('-')
    .concat(fiveMinIndex.toString())
  let pool = Pool.load(event.address.toHexString())
  let poolFiveMinuteData = PoolFiveMinuteData.load(fiveMinPoolId)
  if (poolFiveMinuteData === null) {
    poolFiveMinuteData = new PoolFiveMinuteData(fiveMinPoolId)
    poolFiveMinuteData.date = periodStartUnix
    poolFiveMinuteData.pool = pool.id
    // things that dont get initialized always
    poolFiveMinuteData.volumeToken0 = ZERO_BD
    poolFiveMinuteData.volumeToken1 = ZERO_BD
    poolFiveMinuteData.volumeUSD = ZERO_BD
    poolFiveMinuteData.feesUSD = ZERO_BD
    poolFiveMinuteData.txCount = ZERO_BI
    poolFiveMinuteData.open = pool.token0Price;
    poolFiveMinuteData.high = pool.token0Price;
    poolFiveMinuteData.low = pool.token0Price;
    poolFiveMinuteData.close = pool.token0Price;
  }

  if (pool.token0Price.gt(poolFiveMinuteData.high)) {
    poolFiveMinuteData.high = pool.token0Price;
  }
  if (pool.token0Price.lt(poolFiveMinuteData.low)) {
    poolFiveMinuteData.low = pool.token0Price;
  }

  poolFiveMinuteData.liquidity = pool.liquidity
  poolFiveMinuteData.sqrtPrice = pool.sqrtPrice
  poolFiveMinuteData.token0Price = pool.token0Price
  poolFiveMinuteData.token1Price = pool.token1Price
  poolFiveMinuteData.feeGrowthGlobal0X128 = pool.feeGrowthGlobal0X128
  poolFiveMinuteData.feeGrowthGlobal1X128 = pool.feeGrowthGlobal1X128
  poolFiveMinuteData.close = pool.token0Price;
  poolFiveMinuteData.tick = pool.tick
  poolFiveMinuteData.tvlUSD = pool.totalValueLockedUSD
  poolFiveMinuteData.txCount = poolFiveMinuteData.txCount.plus(ONE_BI)
  poolFiveMinuteData.save()

  return poolFiveMinuteData as PoolFiveMinuteData
}

export function updateTokenDayData(token: Token, event: ethereum.Event): TokenDayData {
  let bundle = Bundle.load('1')
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tokenDayID = token.id
    .toString()
    .concat('-')
    .concat(dayID.toString())
  let tokenPrice = token.derivedETH.times(bundle.ethPriceUSD)

  let tokenDayData = TokenDayData.load(tokenDayID)
  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.token = token.id
    tokenDayData.volume = ZERO_BD
    tokenDayData.volumeUSD = ZERO_BD
    tokenDayData.feesUSD = ZERO_BD
    tokenDayData.untrackedVolumeUSD = ZERO_BD
    tokenDayData.open = tokenPrice
    tokenDayData.high = tokenPrice
    tokenDayData.low = tokenPrice
    tokenDayData.close = tokenPrice
  }

  if (tokenPrice.gt(tokenDayData.high)) {
    tokenDayData.high = tokenPrice
  }

  if (tokenPrice.lt(tokenDayData.low)) {
    tokenDayData.low = tokenPrice
  }

  tokenDayData.close = tokenPrice
  tokenDayData.priceUSD = token.derivedETH.times(bundle.ethPriceUSD)
  tokenDayData.totalValueLocked = token.totalValueLocked
  tokenDayData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenDayData.save()

  return tokenDayData as TokenDayData
}

export function updateTokenHourData(token: Token, event: ethereum.Event): TokenHourData {
  let bundle = Bundle.load('1')
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let tokenHourID = token.id
    .toString()
    .concat('-')
    .concat(hourIndex.toString())
  let tokenHourData = TokenHourData.load(tokenHourID)
  let tokenPrice = token.derivedETH.times(bundle.ethPriceUSD)

  if (tokenHourData === null) {
    tokenHourData = new TokenHourData(tokenHourID)
    tokenHourData.date = hourStartUnix
    tokenHourData.token = token.id
    tokenHourData.volume = ZERO_BD
    tokenHourData.volumeUSD = ZERO_BD
    tokenHourData.untrackedVolumeUSD = ZERO_BD
    tokenHourData.feesUSD = ZERO_BD
    tokenHourData.open = tokenPrice
    tokenHourData.high = tokenPrice
    tokenHourData.low = tokenPrice
    tokenHourData.close = tokenPrice
  }

  if (tokenPrice.gt(tokenHourData.high)) {
    tokenHourData.high = tokenPrice
  }

  if (tokenPrice.lt(tokenHourData.low)) {
    tokenHourData.low = tokenPrice
  }

  tokenHourData.close = tokenPrice
  tokenHourData.priceUSD = tokenPrice
  tokenHourData.totalValueLocked = token.totalValueLocked
  tokenHourData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenHourData.save()

  return tokenHourData as TokenHourData
}

export function updateTickDayData(tick: Tick, event: ethereum.Event): TickDayData {
  let timestamp = event.block.timestamp.toI32()
  let dayIndex = timestamp / 86400
  let dayStartTimestamp = dayIndex * 86400
  let dayTickID = tick.id.concat('-').concat(dayIndex.toString())
  let tickDayData = TickDayData.load(dayTickID)
  if (tickDayData === null) {
    tickDayData = new TickDayData(dayTickID)
    tickDayData.date = dayStartTimestamp
    tickDayData.pool = tick.pool
    tickDayData.tick = tick.id
    tickDayData.tickIdx = tick.tickIdx
    tickDayData.startingVolumeToken0 = tick.volumeToken0
    tickDayData.startingVolumeToken1 = tick.volumeToken1
    tickDayData.startingVolumeUSD = tick.volumeUSD
    tickDayData.startingFeesToken0 = tick.feesToken0
    tickDayData.startingFeesToken1 = tick.feesToken1
    tickDayData.startingFeesUSD = tick.feesUSD
    tickDayData.volumeToken0 = ZERO_BD
    tickDayData.volumeToken1 = ZERO_BD
    tickDayData.volumeUSD = ZERO_BD
    tickDayData.feesToken0 = ZERO_BD
    tickDayData.feesToken1 = ZERO_BD
    tickDayData.feesUSD = ZERO_BD
  }
  tickDayData.liquidityGross = tick.liquidityGross
  tickDayData.liquidityNet = tick.liquidityNet
  tickDayData.feeGrowthOutside0X128 = tick.feeGrowthOutside0X128
  tickDayData.feeGrowthOutside1X128 = tick.feeGrowthOutside1X128

  tickDayData.save()

  return tickDayData as TickDayData
}

export function updateTickHourData(tick: Tick, event: ethereum.Event): TickHourData {
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let hourTickID = tick.id.concat('-').concat(hourIndex.toString())
  let tickHourData = TickHourData.load(hourTickID)
  if (tickHourData === null) {
    tickHourData = new TickHourData(hourTickID)
    tickHourData.date = hourStartUnix
    tickHourData.pool = tick.pool
    tickHourData.tick = tick.id
    tickHourData.tickIdx = tick.tickIdx
    tickHourData.startingVolumeToken0 = tick.volumeToken0
    tickHourData.startingVolumeToken1 = tick.volumeToken1
    tickHourData.startingVolumeUSD = tick.volumeUSD
    tickHourData.startingFeesToken0 = tick.feesToken0
    tickHourData.startingFeesToken1 = tick.feesToken1
    tickHourData.startingFeesUSD = tick.feesUSD
    tickHourData.volumeToken0 = ZERO_BD
    tickHourData.volumeToken1 = ZERO_BD
    tickHourData.volumeUSD = ZERO_BD
    tickHourData.feesToken0 = ZERO_BD
    tickHourData.feesToken1 = ZERO_BD
    tickHourData.feesUSD = ZERO_BD
  }
  tickHourData.liquidityGross = tick.liquidityGross
  tickHourData.liquidityNet = tick.liquidityNet
  tickHourData.feeGrowthOutside0X128 = tick.feeGrowthOutside0X128
  tickHourData.feeGrowthOutside1X128 = tick.feeGrowthOutside1X128

  tickHourData.save()

  return tickHourData as TickHourData
}

export function updateTickFiveMinuteData(tick: Tick, event: ethereum.Event): TickFiveMinuteData {
  let timestamp = event.block.timestamp.toI32()
  let fiveMinIndex = timestamp / 300; // get unique 5 min interval within unix history
  let periodStartUnix = fiveMinIndex * 300; // want the rounded effect
  let fiveMinTickID = tick.id.concat('-').concat(fiveMinIndex.toString())
  let tickFiveMinuteData = TickFiveMinuteData.load(fiveMinTickID)
  if (tickFiveMinuteData === null) {
    tickFiveMinuteData = new TickFiveMinuteData(fiveMinTickID)
    tickFiveMinuteData.date = periodStartUnix
    tickFiveMinuteData.pool = tick.pool
    tickFiveMinuteData.tick = tick.id
    tickFiveMinuteData.tickIdx = tick.tickIdx
    tickFiveMinuteData.startingVolumeToken0 = tick.volumeToken0
    tickFiveMinuteData.startingVolumeToken1 = tick.volumeToken1
    tickFiveMinuteData.startingVolumeUSD = tick.volumeUSD
    tickFiveMinuteData.startingFeesToken0 = tick.feesToken0
    tickFiveMinuteData.startingFeesToken1 = tick.feesToken1
    tickFiveMinuteData.startingFeesUSD = tick.feesUSD
    tickFiveMinuteData.volumeToken0 = ZERO_BD
    tickFiveMinuteData.volumeToken1 = ZERO_BD
    tickFiveMinuteData.volumeUSD = ZERO_BD
    tickFiveMinuteData.feesToken0 = ZERO_BD
    tickFiveMinuteData.feesToken1 = ZERO_BD
    tickFiveMinuteData.feesUSD = ZERO_BD
  }
  tickFiveMinuteData.liquidityGross = tick.liquidityGross
  tickFiveMinuteData.liquidityNet = tick.liquidityNet
  tickFiveMinuteData.feeGrowthOutside0X128 = tick.feeGrowthOutside0X128
  tickFiveMinuteData.feeGrowthOutside1X128 = tick.feeGrowthOutside1X128

  tickFiveMinuteData.save()

  return tickFiveMinuteData as TickFiveMinuteData
}