import { ethereum } from '@graphprotocol/graph-ts'

import { Position, PositionSnapshot } from '../../src/types/schema'

/**
 * Create a snapshot of a position
 * @param position The position to snapshot
 * @param event The event that triggered the snapshot
 * @returns The position snapshot
 */
export function createPositionSnapshot(position: Position, event: ethereum.Event): PositionSnapshot {
  const snapshotId = position.id + '-' + event.block.number.toString()

  const snapshot = new PositionSnapshot(snapshotId)
  snapshot.owner = position.owner
  snapshot.pool = position.pool
  snapshot.position = position.id
  snapshot.blockNumber = event.block.number
  snapshot.timestamp = event.block.timestamp
  snapshot.liquidity = position.liquidity
  snapshot.depositedToken0 = position.depositedToken0
  snapshot.depositedToken1 = position.depositedToken1
  snapshot.withdrawnToken0 = position.withdrawnToken0
  snapshot.withdrawnToken1 = position.withdrawnToken1
  snapshot.collectedFeesToken0 = position.collectedFeesToken0
  snapshot.collectedFeesToken1 = position.collectedFeesToken1
  snapshot.transaction = event.transaction.hash.toHexString()

  snapshot.save()

  return snapshot
}
