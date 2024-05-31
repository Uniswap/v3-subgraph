import { BigInt } from '@graphprotocol/graph-ts'

import { Bundle, Factory, Mint, Pool, Tick, Token } from '../../types/schema'
import { Mint as MintEvent } from '../../types/templates/Pool/Pool'
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
import { createTick } from '../../utils/tick'

export function handleMint(event: MintEvent): void {
  handleMintHelper(event)
}

export function handleMintHelper(event: MintEvent, subgraphConfig: SubgraphConfig = getSubgraphConfig()): void {
  const factoryAddress = subgraphConfig.factoryAddress

  const bundle = Bundle.load('1')!
  const poolAddress = event.address.toHexString()
  const pool = Pool.load(poolAddress)!
  const factory = Factory.load(factoryAddress)!

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  if (token0 && token1) {
    const amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
    const amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

    const amountUSD = amount0
      .times(token0.derivedETH.times(bundle.ethPriceUSD))
      .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)))

    // reset tvl aggregates until new amounts calculated
    factory.totalValueLockedETH = factory.totalValueLockedETH.minus(pool.totalValueLockedETH)

    // update globals
    factory.txCount = factory.txCount.plus(ONE_BI)

    // update token0 data
    token0.txCount = token0.txCount.plus(ONE_BI)
    token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
    token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH.times(bundle.ethPriceUSD))

    // update token1 data
    token1.txCount = token1.txCount.plus(ONE_BI)
    token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
    token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH.times(bundle.ethPriceUSD))

    // pool data
    pool.txCount = pool.txCount.plus(ONE_BI)

    // Pools liquidity tracks the currently active liquidity given pools current tick.
    // We only want to update it on mint if the new position includes the current tick.
    if (
      pool.tick !== null &&
      BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
      BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
    ) {
      pool.liquidity = pool.liquidity.plus(event.params.amount)
    }

    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
    pool.totalValueLockedETH = pool.totalValueLockedToken0
      .times(token0.derivedETH)
      .plus(pool.totalValueLockedToken1.times(token1.derivedETH))
    pool.totalValueLockedUSD = pool.totalValueLockedETH.times(bundle.ethPriceUSD)

    // reset aggregates with new amounts
    factory.totalValueLockedETH = factory.totalValueLockedETH.plus(pool.totalValueLockedETH)
    factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)

    const transaction = loadTransaction(event)
    const mint = new Mint(transaction.id.toString() + '-' + event.logIndex.toString())
    mint.transaction = transaction.id
    mint.timestamp = transaction.timestamp
    mint.pool = pool.id
    mint.token0 = pool.token0
    mint.token1 = pool.token1
    mint.owner = event.params.owner
    mint.sender = event.params.sender
    mint.origin = event.transaction.from
    mint.amount = event.params.amount
    mint.amount0 = amount0
    mint.amount1 = amount1
    mint.amountUSD = amountUSD
    mint.tickLower = BigInt.fromI32(event.params.tickLower)
    mint.tickUpper = BigInt.fromI32(event.params.tickUpper)
    mint.logIndex = event.logIndex

    // tick entities
    const lowerTickIdx = event.params.tickLower
    const upperTickIdx = event.params.tickUpper

    const lowerTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickLower).toString()
    const upperTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickUpper).toString()

    let lowerTick = Tick.load(lowerTickId)
    let upperTick = Tick.load(upperTickId)

    if (lowerTick === null) {
      lowerTick = createTick(lowerTickId, lowerTickIdx, pool.id, event)
    }

    if (upperTick === null) {
      upperTick = createTick(upperTickId, upperTickIdx, pool.id, event)
    }

    const amount = event.params.amount
    lowerTick.liquidityGross = lowerTick.liquidityGross.plus(amount)
    lowerTick.liquidityNet = lowerTick.liquidityNet.plus(amount)
    upperTick.liquidityGross = upperTick.liquidityGross.plus(amount)
    upperTick.liquidityNet = upperTick.liquidityNet.minus(amount)

    lowerTick.save()
    upperTick.save()

    // TODO: Update Tick's volume, fees, and liquidity provider count. Computing these on the tick
    // level requires reimplementing some of the swapping code from v3-core.

    updateUniswapDayData(event, factoryAddress)
    updatePoolDayData(event)
    updatePoolHourData(event)
    updateTokenDayData(token0 as Token, event)
    updateTokenDayData(token1 as Token, event)
    updateTokenHourData(token0 as Token, event)
    updateTokenHourData(token1 as Token, event)

    token0.save()
    token1.save()
    pool.save()
    factory.save()
    mint.save()
  }
}
