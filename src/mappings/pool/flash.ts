import { BigInt } from '@graphprotocol/graph-ts'

import { Pool as PoolABI } from '../..//types/Factory/Pool'
import { Pool } from '../../types/schema'
import { Flash as FlashEvent } from '../../types/templates/Pool/Pool'

export function handleFlash(event: FlashEvent): void {
  // update fee growth
  const pool = Pool.load(event.address.toHexString())!
  const poolContract = PoolABI.bind(event.address)
  const feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128()
  const feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal1X128()
  pool.feeGrowthGlobal0X128 = feeGrowthGlobal0X128 as BigInt
  pool.feeGrowthGlobal1X128 = feeGrowthGlobal1X128 as BigInt
  pool.save()
}
