/* eslint-disable prefer-const */
import {
  Bundle,
  Pool,
  Token,
  Transaction,
  Factory,
  Mint as MintEvent,
  Burn as BurnEvent,
  Swap as SwapEvent
} from '../types/schema'
import { log, store, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import {
  Pool as PoolContract,
  Swap,
  Mint as PoolMint,
  Burn as PoolBurn,
  Initialize
} from '../types/templates/Pool/Pool'

import { convertTokenToDecimal, ONE_BI, FACTORY_ADDRESS, ADDRESS_ZERO, BI_18 } from './helpers'
import { ZERO_BI } from '../utils/constants'

export function handleSwap(event: Swap): void {
  // let pool = Pool.load(event.address.toHexString())
  // let token0 = Token.load(pool.token0)
  // let token1 = Token.load(pool.token1)
  // let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  // let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  // // No more sync event, so need additional logic for updating bundle here if pool is part of bundle
  // // ETH/USD prices
  // let bundle = Bundle.load('1')
  // // get total amounts of derived USD and ETH for tracking
  // let derivedAmountETH = (token1.derivedETH.times(amount1))
  //     .plus(token0.derivedETH.times(amount0))
  //     .div(BigDecimal.fromString('2'))
  // let derivedAmountUSD = derivedAmountETH.times(bundle.ethPrice)
  // let trackedAmountETH: BigDecimal
  // let trackedAmountUSD: BigDecimal
  // if (bundle.ethPrice.equals(ZERO_BD)) {
  // }
  // let trackedAmountUSD = getTrackedVolumeUSD(amount0Total, token0 as Token, amount1Total, token1 as Token, pair as Pair)
  // let trackedAmountETH: BigDecimal
  // if (bundle.ethPrice.equals(ZERO_BD)) {
  //     trackedAmountETH = ZERO_BD
  // } else {
  //     trackedAmountETH = trackedAmountUSD.div(bundle.ethPrice)
  // }
}

export function handleInitialize(event: Initialize): void {
  log.info(`Saw a pool initialize! {}`, [event.block.number.toString()])

  let pool = Pool.load(event.address.toHexString())
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.tick = BigInt.fromI32(event.params.tick)
  pool.save()
}

export function handlePoolMint(event: PoolMint): void {
  log.info(`Saw a pool mint! {}`, [event.block.number.toString()])

  let transaction = Transaction.load(event.transaction.hash.toHexString())
  let mints = transaction.mints
  //   log.info(`This is mints! {}`, [JSON.stringify(mints)])
  let mint = MintEvent.load(mints[mints.length - 1])

  let pool = Pool.load(event.address.toHexString())
  let uniswap = Factory.load(FACTORY_ADDRESS)

  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  // update txn counts
  token0.txCount = token0.txCount.plus(ONE_BI)
  token1.txCount = token1.txCount.plus(ONE_BI)

  pool.liquidity = pool.liquidity.plus(event.params.amount)
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)

  token0.save()
  token1.save()
  pool.save()
  uniswap.save()
  // Calculate new reserveUSD
  // Calculate amount of liquidity to distribute to each tick

  // Create mint entity
  mint.sender = event.params.sender
  mint.tickLower = BigInt.fromI32(event.params.tickLower)
  mint.tickUpper = BigInt.fromI32(event.params.tickUpper)
  mint.amount0 = amount0 as BigDecimal
  mint.amount1 = amount1 as BigDecimal
  mint.logIndex = event.logIndex
  // mint.amountUSD = amountTotalUSD as BigDecimal
  mint.save()

  // Update hourly and daily datas
}

export function handlePoolBurn(event: PoolBurn): void {
  log.info(`Saw a pool burn! {}`, [event.block.number.toString()])
}
