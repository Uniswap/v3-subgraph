/* eslint-disable prefer-const */
import { Collect, Factory, Pool, Token } from '../../types/schema'
import { Collect as CollectEvent } from '../../types/templates/Pool/Pool'
import { convertTokenToDecimal, loadTransaction } from '../../utils'
import { FACTORY_ADDRESS, ONE_BI } from '../../utils/constants'
import { AmountType, getAdjustedAmounts } from '../../utils/pricing'
import { BigInt } from '@graphprotocol/graph-ts'
import { updateDerivedTVLAmounts } from '../../utils/tvl'

export function handleCollect(event: CollectEvent): boolean {
  // update fee growth
  let pool = Pool.load(event.address.toHexString())
  let factory = Factory.load(FACTORY_ADDRESS)
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)
  let transaction = loadTransaction(event)

  // Get formatted amounts collected.
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  let amounts: AmountType = getAdjustedAmounts(
    // Used for USD in Collect event.
    pool.totalValueLockedToken0,
    token0 as Token,
    pool.totalValueLockedToken1,
    token1 as Token
  )

  // Adjust pool TVL based on amount collected.
  let oldPoolTVLETH = pool.totalValueLockedETH
  let oldPoolTVLETHUntracked = pool.totalValueLockedETHUntracked
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(amount1)
  token0.totalValueLocked = token0.totalValueLocked.minus(amount0)
  token1.totalValueLocked = token1.totalValueLocked.minus(amount1)
  updateDerivedTVLAmounts(pool as Pool, factory as Factory, oldPoolTVLETH, oldPoolTVLETHUntracked)

  // Update aggregate fee collection values.
  pool.collectedFeesToken0 = pool.collectedFeesToken0.plus(amount0)
  pool.collectedFeesToken1 = pool.collectedFeesToken1.plus(amount1)
  pool.collectedFeesUSD = pool.collectedFeesUSD.plus(amounts.usd)

  // Update transaction counts.
  factory.txCount = factory.txCount.plus(ONE_BI)
  token0.txCount = token0.txCount.plus(ONE_BI)
  token1.txCount = token1.txCount.plus(ONE_BI)
  pool.txCount = pool.txCount.plus(ONE_BI)

  let collectID = event.transaction.hash
    .toString()
    .concat('-')
    .concat(event.logIndex.toString())
  let collect = new Collect(collectID)
  collect.transaction = transaction.id
  collect.timestamp = event.block.timestamp
  collect.pool = pool.id
  collect.owner = event.params.owner
  collect.amount0 = amount0
  collect.amount1 = amount1
  collect.amountUSD = amounts.usd
  collect.tickLower = BigInt.fromI32(event.params.tickLower)
  collect.tickUpper = BigInt.fromI32(event.params.tickUpper)
  collect.logIndex = event.logIndex

  token0.save()
  token1.save()
  factory.save()
  pool.save()
  collect.save()

  return true
}
