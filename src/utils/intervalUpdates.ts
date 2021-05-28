import { ZERO_BD, ZERO_BI, ONE_BI } from './constants'
/* eslint-disable prefer-const */
import { UniswapDayData, Factory, Pool, PoolDayData, Token, TokenDayData, Bundle, PoolHourData, PoolFiveMinuteData } from './../types/schema'
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
    poolDayData.open = pool.token0Price;
    poolDayData.high = pool.token0Price;
    poolDayData.low = pool.token0Price;
    poolDayData.close = pool.token0Price;
  }
 
  if (pool.token0Price.gt(poolDayData.high)) {
    poolDayData.high = pool.token0Price;
  }
  if (pool.token0Price.lt(poolDayData.low)) {
    poolDayData.low = pool.token0Price;
  }
  
  poolDayData.liquidity = pool.liquidity
  poolDayData.sqrtPrice = pool.sqrtPrice
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
        poolHourData.periodStartUnix = hourStartUnix
        poolHourData.pool = pool.id
        // things that dont get initialized always
        poolHourData.volumeToken0 = ZERO_BD
        poolHourData.volumeToken1 = ZERO_BD
        poolHourData.volumeUSD = ZERO_BD
        poolHourData.feesUSD = ZERO_BD
        poolHourData.txCount = ZERO_BI
        poolHourData.open = pool.token0Price;
        poolHourData.high = pool.token0Price;
        poolHourData.low = pool.token0Price;
        poolHourData.close = pool.token0Price;
    }

    if (pool.token0Price.gt(poolHourData.high)) {
        poolHourData.high = pool.token0Price;
    }
    if (pool.token0Price.lt(poolHourData.low)) {
        poolHourData.low = pool.token0Price;
    }

    poolHourData.liquidity = pool.liquidity
    poolHourData.sqrtPrice = pool.sqrtPrice
    poolHourData.token0Price = pool.token0Price
    poolHourData.token1Price = pool.token1Price
    poolHourData.close = pool.token0Price;
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
    poolFiveMinuteData.periodStartUnix = periodStartUnix
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

  let tokenDayData = TokenDayData.load(tokenDayID)
  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.token = token.id
    tokenDayData.volume = ZERO_BD
    tokenDayData.volumeUSD = ZERO_BD
    tokenDayData.feesUSD = ZERO_BD
    tokenDayData.untrackedVolumeUSD = ZERO_BD
  }
  tokenDayData.priceUSD = token.derivedETH.times(bundle.ethPriceUSD)
  tokenDayData.totalValueLocked = token.totalValueLocked
  tokenDayData.totalValueLockedUSD = token.totalValueLockedUSD
  tokenDayData.save()

  return tokenDayData as TokenDayData
}
