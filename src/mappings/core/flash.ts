import { Pool } from '../../../generated/schema'
import { Pool as PoolABI } from '../../../generated/Factory/Pool'
import { BigInt } from '@graphprotocol/graph-ts'
import { Flash as FlashEvent } from '../../../generated/templates/Pool/Pool'

export function handleFlash(event: FlashEvent): void {
  // update fee growth
  let pool = Pool.load(event.address.toHexString())
  if (pool) {
    let poolContract = PoolABI.bind(event.address)
    let feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128()
    let feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal1X128()
    pool.feeGrowthGlobal0X128 = feeGrowthGlobal0X128 as BigInt
    pool.feeGrowthGlobal1X128 = feeGrowthGlobal1X128 as BigInt
    pool.save()
  }
}
