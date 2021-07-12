/* eslint-disable prefer-const */
import { BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ticktoPrice, safeDiv } from '.'
import { Tick, Pool, Token } from '../types/schema'
import { ONE_BD, ZERO_BD, ZERO_BI } from './constants'

export function createTick(tickId: string, tickIdx: i32, poolId: string, event: ethereum.Event): Tick {
  let tick = new Tick(tickId)
  tick.tickIdx = BigInt.fromI32(tickIdx)
  tick.pool = poolId
  tick.poolAddress = poolId

  tick.createdAtTimestamp = event.block.timestamp
  tick.createdAtBlockNumber = event.block.number
  tick.liquidityGross = ZERO_BI
  tick.liquidityNet = ZERO_BI
  tick.liquidityProviderCount = ZERO_BI

  tick.price0 = ONE_BD
  tick.price1 = ONE_BD

  let pool = Pool.load(poolId)
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)

  // 1.0001^tick is token0/token1.
  let price1 = ticktoPrice(
    BigDecimal.fromString('1.0001'), 
    BigInt.fromI32(tickIdx),
    token0.decimals,
    token1.decimals
  )
  tick.price1 = price1
  tick.price0 = safeDiv(ONE_BD, price1)

  tick.volumeToken0 = ZERO_BD
  tick.volumeToken1 = ZERO_BD
  tick.volumeUSD = ZERO_BD
  tick.feesToken0 = ZERO_BD
  tick.feesToken1 = ZERO_BD
  tick.feesUSD = ZERO_BD
  tick.untrackedVolumeUSD = ZERO_BD
  tick.collectedFeesToken0 = ZERO_BD
  tick.collectedFeesToken1 = ZERO_BD
  tick.collectedFeesUSD = ZERO_BD
  tick.liquidityProviderCount = ZERO_BI
  tick.feeGrowthOutside0X128 = ZERO_BI
  tick.feeGrowthOutside1X128 = ZERO_BI

  return tick
}

export function feeTierToTickSpacing(feeTier: BigInt): BigInt {
  if (feeTier.equals(BigInt.fromI32(10000))) {
    return BigInt.fromI32(200)
  }
  if (feeTier.equals(BigInt.fromI32(3000))) {
    return BigInt.fromI32(60)
  }
  if (feeTier.equals(BigInt.fromI32(500))) {
    return BigInt.fromI32(10)
  }

  throw Error('Unexpected fee tier')
}
