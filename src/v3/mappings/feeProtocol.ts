import { BigInt } from '@graphprotocol/graph-ts'

import { Pool } from '../../../generated/schema'
import { SetFeeProtocol } from '../../../generated/templates/Pool/Pool'

/**
 * Stores the pool's on-chain protocol fee as the raw packed uint8 emitted in
 * SetFeeProtocol's new values (lower 4 bits = token0's fee denominator, upper
 * 4 bits = token1's), identical to the packing of slot0's feeProtocol.
 * Consumers unpack the two directions; storing the raw value keeps the
 * subgraph lossless. 0 = protocol fee switch off.
 */
export function handleSetFeeProtocol(event: SetFeeProtocol): void {
  const pool = Pool.load(event.address)
  if (pool === null) {
    // Pool unknown (e.g. only tracked via grafting edge cases); nothing to update.
    return
  }
  pool.feeProtocol = BigInt.fromI32(event.params.feeProtocol0New + (event.params.feeProtocol1New << 4))
  pool.save()
}
