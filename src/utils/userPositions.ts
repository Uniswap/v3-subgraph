import { BigDecimal, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'

import { Bundle, Pool, Position, Token, UserPoolTvl } from '../types/schema'
import { ZERO_BD, ZERO_BI } from './constants'
import { ensureUser, snapshotUser } from './userTvl'

function pricesUSD(pool: Pool, bundle: Bundle): BigDecimal[] {
  const token0 = Token.load(pool.token0)!
  const token1 = Token.load(pool.token1)!
  const p0 = token0.derivedETH.times(bundle.ethPriceUSD)
  const p1 = token1.derivedETH.times(bundle.ethPriceUSD)
  return [p0, p1]
}

export function onMintUpdatePositionAndRevalue(
  owner: Bytes,
  pool: Pool,
  _tickLower: i32,
  _tickUpper: i32,
  _liquidityDelta: BigInt,
  amount0: BigDecimal,
  amount1: BigDecimal,
  bundle: Bundle,
  event: ethereum.Event,
): void {
  const user = ensureUser(owner, event)
  const [p0, p1] = pricesUSD(pool, bundle)
  const delta = amount0.times(p0).plus(amount1.times(p1))
  user.tvlUSD = user.tvlUSD.plus(delta)
  user.lastUpdatedBlock = event.block.number
  user.lastUpdatedTs = event.block.timestamp
  user.save()
  snapshotUser(owner, user.tvlUSD, event)
}

export function onBurnUpdatePositionAndRevalue(
  owner: Bytes,
  pool: Pool,
  _tickLower: i32,
  _tickUpper: i32,
  _liquidityDelta: BigInt,
  amount0: BigDecimal,
  amount1: BigDecimal,
  bundle: Bundle,
  event: ethereum.Event,
): void {
  const user = ensureUser(owner, event)
  const [p0, p1] = pricesUSD(pool, bundle)
  const delta = amount0.times(p0).plus(amount1.times(p1)).times(BigDecimal.fromString('-1'))
  user.tvlUSD = user.tvlUSD.plus(delta)
  user.lastUpdatedBlock = event.block.number
  user.lastUpdatedTs = event.block.timestamp
  user.save()
  snapshotUser(owner, user.tvlUSD, event)
}

// --- Position tracking helpers ---

function positionIdFor(owner: Bytes, poolId: string, tickLower: i32, tickUpper: i32): string {
  return owner.toHexString()
    .concat('-')
    .concat(poolId)
    .concat('-')
    .concat(BigInt.fromI32(tickLower).toString())
    .concat('-')
    .concat(BigInt.fromI32(tickUpper).toString())
}

function getOrCreatePosition(owner: Bytes, pool: Pool, tickLower: i32, tickUpper: i32): Position {
  const id = positionIdFor(owner, pool.id, tickLower, tickUpper)
  let p = Position.load(id)
  if (p === null) {
    p = new Position(id)
    p.owner = owner
    p.pool = pool.id
    p.tickLower = BigInt.fromI32(tickLower)
    p.tickUpper = BigInt.fromI32(tickUpper)
    p.liquidity = ZERO_BI
    p.netToken0 = ZERO_BD
    p.netToken1 = ZERO_BD
  }
  return p as Position
}

// Pool position index omitted in stable build

export function recordMintPosition(
  owner: Bytes,
  pool: Pool,
  tickLower: i32,
  tickUpper: i32,
  liquidityDelta: BigInt,
  amount0: BigDecimal,
  amount1: BigDecimal,
): void {
  const pos = getOrCreatePosition(owner, pool, tickLower, tickUpper)
  pos.liquidity = pos.liquidity.plus(liquidityDelta)
  pos.netToken0 = pos.netToken0.plus(amount0)
  pos.netToken1 = pos.netToken1.plus(amount1)
  pos.save()
  // index omitted
}

export function recordBurnPosition(
  owner: Bytes,
  pool: Pool,
  tickLower: i32,
  tickUpper: i32,
  liquidityDelta: BigInt,
  amount0: BigDecimal,
  amount1: BigDecimal,
): void {
  const pos = getOrCreatePosition(owner, pool, tickLower, tickUpper)
  pos.liquidity = pos.liquidity.minus(liquidityDelta)
  pos.netToken0 = pos.netToken0.minus(amount0)
  pos.netToken1 = pos.netToken1.minus(amount1)
  pos.save()
  // index omitted
}

// Pool-wide revaluation omitted in stable build
