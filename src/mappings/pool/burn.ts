import { BigInt } from '@graphprotocol/graph-ts'

import { Bundle, Burn, Factory, Pool, Tick, Token } from '../../types/schema'
import { Burn as BurnEvent } from '../../types/templates/Pool/Pool'
import { convertTokenToDecimal, loadTransaction } from '../../utils'
import { FACTORY_ADDRESS, ONE_BI } from '../../utils/constants'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateTokenHourData,
  updateUniswapDayData,
} from '../../utils/intervalUpdates'

export function handleBurn(event: BurnEvent): void {
  const bundle = Bundle.load('1')!
  const poolAddress = event.address.toHexString()
  const pool = Pool.load(poolAddress)!
  const factory = Factory.load(FACTORY_ADDRESS)!

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
    token0.totalValueLocked = token0.totalValueLocked.minus(amount0)
    token0.totalValueLockedUSD = token0.totalValueLocked.times(token0.derivedETH.times(bundle.ethPriceUSD))

    // update token1 data
    token1.txCount = token1.txCount.plus(ONE_BI)
    token1.totalValueLocked = token1.totalValueLocked.minus(amount1)
    token1.totalValueLockedUSD = token1.totalValueLocked.times(token1.derivedETH.times(bundle.ethPriceUSD))

    // pool data
    pool.txCount = pool.txCount.plus(ONE_BI)
    // Pools liquidity tracks the currently active liquidity given pools current tick.
    // We only want to update it on burn if the position being burnt includes the current tick.
    if (
      pool.tick !== null &&
      BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
      BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
    ) {
      pool.liquidity = pool.liquidity.minus(event.params.amount)
    }

    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(amount0)
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(amount1)
    pool.totalValueLockedETH = pool.totalValueLockedToken0
      .times(token0.derivedETH)
      .plus(pool.totalValueLockedToken1.times(token1.derivedETH))
    pool.totalValueLockedUSD = pool.totalValueLockedETH.times(bundle.ethPriceUSD)

    // reset aggregates with new amounts
    factory.totalValueLockedETH = factory.totalValueLockedETH.plus(pool.totalValueLockedETH)
    factory.totalValueLockedUSD = factory.totalValueLockedETH.times(bundle.ethPriceUSD)

    // burn entity
    const transaction = loadTransaction(event)
    const burn = new Burn(transaction.id + '#' + pool.txCount.toString())
    burn.transaction = transaction.id
    burn.timestamp = transaction.timestamp
    burn.pool = pool.id
    burn.token0 = pool.token0
    burn.token1 = pool.token1
    burn.owner = event.params.owner
    burn.origin = event.transaction.from
    burn.amount = event.params.amount
    burn.amount0 = amount0
    burn.amount1 = amount1
    burn.amountUSD = amountUSD
    burn.tickLower = BigInt.fromI32(event.params.tickLower)
    burn.tickUpper = BigInt.fromI32(event.params.tickUpper)
    burn.logIndex = event.logIndex

    // tick entities
    const lowerTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickLower).toString()
    const upperTickId = poolAddress + '#' + BigInt.fromI32(event.params.tickUpper).toString()
    const lowerTick = Tick.load(lowerTickId)
    const upperTick = Tick.load(upperTickId)
    if (lowerTick && upperTick) {
      const amount = event.params.amount
      lowerTick.liquidityGross = lowerTick.liquidityGross.minus(amount)
      lowerTick.liquidityNet = lowerTick.liquidityNet.minus(amount)
      upperTick.liquidityGross = upperTick.liquidityGross.minus(amount)
      upperTick.liquidityNet = upperTick.liquidityNet.plus(amount)

      lowerTick.save()
      upperTick.save()
    }
    updateUniswapDayData(event)
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
    burn.save()
  }
}
