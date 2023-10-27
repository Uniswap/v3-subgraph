import { Pool } from '../../types/schema'
import { Pool as PoolABI } from '../types/Factory/Pool'
import {
    Flash as FlashEvent
  } from '../types/templates/Pool/Pool'


export function handleFlash(event: FlashEvent): void {
    // update fee growth
    let pool = Pool.load(event.address.toHexString())
    let poolContract = PoolABI.bind(event.address)
    let feeGrowthGlobal0X128 = poolContract.feeGrowthGlobal0X128()
    let feeGrowthGlobal1X128 = poolContract.feeGrowthGlobal1X128()
    pool.feeGrowthGlobal0X128 = feeGrowthGlobal0X128 as BigInt
    pool.feeGrowthGlobal1X128 = feeGrowthGlobal1X128 as BigInt
    pool.save()
  }