import { BigInt } from '@graphprotocol/graph-ts'

import { Bundle, Collect, Factory, Pool, Token } from '../../types/schema'
import { Collect as CollectEvent } from '../../types/templates/Pool/Pool'
import { convertTokenToDecimal, loadTransaction } from '../../utils'
import { getSubgraphConfig, SubgraphConfig } from '../../utils/chains'
import { ONE_BI } from '../../utils/constants'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateTokenHourData,
  updateUniswapDayData,
} from '../../utils/intervalUpdates'
import { getOrCreatePosition, updatePositionWithCollect } from '../../utils/position'
import { createPositionSnapshot } from '../../utils/positionSnapshot'
import { getTrackedAmountUSD } from '../../utils/pricing'

export function handleCollect(event: CollectEvent): void {
  handleCollectHelper(event)
}

export function handleCollectHelper(event: CollectEvent, subgraphConfig: SubgraphConfig = getSubgraphConfig()): void {
  const factoryAddress = subgraphConfig.factoryAddress
  const whitelistTokens = subgraphConfig.whitelistTokens

  const bundle = Bundle.load('1')!
  const poolAddress = event.address.toHexString()
  const pool = Pool.load(poolAddress)!
  const factory = Factory.load(factoryAddress)!

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)
  if (token0 == null || token1 == null) {
    return
  }

  const transaction = loadTransaction(event)

  // Get formatted amounts collected.
  const collectedAmountToken0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  const collectedAmountToken1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  const trackedCollectedAmountUSD = getTrackedAmountUSD(
    collectedAmountToken0,
    token0 as Token,
    collectedAmountToken1,
    token1 as Token,
    whitelistTokens,
  )

  // Reset tvl aggregates until new amounts calculated
  factory.totalValueLockedETH = factory.totalValueLockedETH.minus(pool.totalValueLockedETH)

  // Update globals
  factory.txCount = factory.txCount.plus(ONE_BI)

  // update token data
  token0.txCount = token0.txCount.plus(ONE_BI)
  token0.totalValueLocked = token0.totalValueLocked.minus(collectedAmountToken0)
  token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH.times(bundle.ethPriceUSD))

  token1.txCount = token1.txCount.plus(ONE_BI)
  token1.totalValueLocked = token1.totalValueLocked.minus(collectedAmountToken1)
  token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH.times(bundle.ethPriceUSD))

  // Adjust pool TVL based on amount collected.
  pool.txCount = pool.txCount.plus(ONE_BI)
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(collectedAmountToken0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(collectedAmountToken1)
  pool.totalValueLockedETH = pool.totalValueLockedToken0
    .times(token0.derivedETH)
    .plus(pool.totalValueLockedToken1.times(token1.derivedETH))
  pool.totalValueLockedUSD = pool.totalValueLockedETH.times(bundle.ethPriceUSD)

  // Update aggregate fee collection values.
  pool.collectedFeesToken0 = pool.collectedFeesToken0.plus(collectedAmountToken0)
  pool.collectedFeesToken1 = pool.collectedFeesToken1.plus(collectedAmountToken1)
  pool.collectedFeesUSD = pool.collectedFeesUSD.plus(trackedCollectedAmountUSD)

  // reset aggregates with new amounts
  factory.totalValueLockedETH = factory.totalValueLockedETH.plus(pool.totalValueLockedETH)
  factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)

  // Update position
  if (event.params.owner) {
    const position = getOrCreatePosition(
      event.params.owner,
      pool,
      BigInt.fromI32(event.params.tickLower),
      BigInt.fromI32(event.params.tickUpper),
      event,
    )
    updatePositionWithCollect(position, collectedAmountToken0, collectedAmountToken1)
    position.save()

    // Create position snapshot
    createPositionSnapshot(position, event)
  }

  // collect entity
  const collect = new Collect(transaction.id + '-' + event.logIndex.toString())
  collect.transaction = transaction.id
  collect.timestamp = transaction.timestamp
  collect.pool = pool.id
  collect.owner = event.params.owner
  collect.amount0 = collectedAmountToken0
  collect.amount1 = collectedAmountToken1
  collect.amountUSD = trackedCollectedAmountUSD
  collect.tickLower = BigInt.fromI32(event.params.tickLower)
  collect.tickUpper = BigInt.fromI32(event.params.tickUpper)
  collect.logIndex = event.logIndex

  updateUniswapDayData(event, factoryAddress)
  updatePoolDayData(event)
  updatePoolHourData(event)
  updateTokenDayData(token0 as Token, event)
  updateTokenDayData(token1 as Token, event)
  updateTokenHourData(token0 as Token, event)
  updateTokenHourData(token1 as Token, event)

  token0.save()
  token1.save()
  factory.save()
  pool.save()
  collect.save()

  return
}
