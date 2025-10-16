import { BigDecimal, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'

import { User, UserDay, UserHour } from '../types/schema'
import { ZERO_BD, ZERO_BI } from './constants'

function getHourStart(ts: i32): i32 {
  const hourIndex = ts / 3600
  return hourIndex * 3600
}

function getDayStart(ts: i32): i32 {
  const dayIndex = ts / 86400
  return dayIndex * 86400
}

function snapshotUserHour(addressHex: string, address: Bytes, tvlUSD: BigDecimal, event: ethereum.Event): void {
  const ts = event.block.timestamp.toI32()
  const id = addressHex.concat('-').concat(event.block.number.toString())
  const snap = new UserHour(id)
  snap.address = address
  snap.periodStartUnix = getHourStart(ts)
  snap.blockNumber = event.block.number
  snap.tvlBlockUSD = tvlUSD
  snap.tvlCurrentUSD = tvlUSD
  snap.save()
}

function snapshotUserDay(addressHex: string, address: Bytes, tvlUSD: BigDecimal, event: ethereum.Event): void {
  const ts = event.block.timestamp.toI32()
  const id = addressHex.concat('-').concat(event.block.number.toString())
  const snap = new UserDay(id)
  snap.address = address
  snap.date = getDayStart(ts)
  snap.blockNumber = event.block.number
  snap.tvlBlockUSD = tvlUSD
  snap.tvlCurrentUSD = tvlUSD
  snap.save()
}

export function upsertUserTvlDelta(address: Bytes, deltaUSD: BigDecimal, event: ethereum.Event): void {
  const addressHex = address.toHexString()
  let user = User.load(addressHex)
  if (user === null) {
    user = new User(addressHex)
    user.address = address
    user.tvlUSD = ZERO_BD
    user.openPositionCount = ZERO_BI
    user.lastUpdatedBlock = event.block.number
    user.lastUpdatedTs = event.block.timestamp
  }

  user.tvlUSD = user.tvlUSD.plus(deltaUSD)
  user.lastUpdatedBlock = event.block.number
  user.lastUpdatedTs = event.block.timestamp
  user.save()

  // Write snapshots keyed by <address>-<blockNumber>
  snapshotUserHour(addressHex, address, user.tvlUSD, event)
  snapshotUserDay(addressHex, address, user.tvlUSD, event)
}

export function snapshotUser(address: Bytes, tvlUSD: BigDecimal, event: ethereum.Event): void {
  const addressHex = address.toHexString()
  snapshotUserHour(addressHex, address, tvlUSD, event)
  snapshotUserDay(addressHex, address, tvlUSD, event)
}

export function ensureUser(address: Bytes, event: ethereum.Event): User {
  const addressHex = address.toHexString()
  let user = User.load(addressHex)
  if (user === null) {
    user = new User(addressHex)
    user.address = address
    user.tvlUSD = ZERO_BD
    user.openPositionCount = ZERO_BI
    user.lastUpdatedBlock = event.block.number
    user.lastUpdatedTs = event.block.timestamp
    user.save()
  }
  return user as User
}
