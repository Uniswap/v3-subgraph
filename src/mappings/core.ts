/* eslint-disable prefer-const */
import {
  Bundle,
  Pool,
  Token,
  Transaction,
  Factory,
  Mint as MintEvent,
  Burn as BurnEvent,
  Swap as SwapEvent,
  Mint,
  Burn
} from '../types/schema'
import { log, store, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import {
  Pool as PoolContract,
  Swap,
  Mint as PoolMint,
  Burn as PoolBurn,
  Initialize
} from '../types/templates/Pool/Pool'

import { convertTokenToDecimal, loadTransaction } from './helpers'
import { FACTORY_ADDRESS, ONE_BI, ZERO_BD } from '../utils/constants'
import { calculatePrice } from '../utils/pricing'

export function handleInitialize(event: Initialize): void {
  log.info(`Saw a pool initialize! {}`, [event.block.number.toString()])
  let pool = Pool.load(event.address.toHexString())
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.tick = BigInt.fromI32(event.params.tick)
  pool.save()
}

export function handleMint(event: PoolMint): void {
  let pool = Pool.load(event.address.toHexString())
  let factory = Factory.load(FACTORY_ADDRESS)

  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  // update globals
  factory.transactionCount = factory.transactionCount.plus(ONE_BI)

  // update token0 data
  token0.txCount = token0.txCount.plus(ONE_BI)
  token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
  // todo - usd + derived prices

  // update token1 data
  token1.txCount = token1.txCount.plus(ONE_BI)
  token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
  // todo - usd + derived prices

  // pool data
  pool.txCount = pool.txCount.plus(ONE_BI)
  pool.liquidity = pool.liquidity.plus(event.params.amount)
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)

  let transaction = loadTransaction(event)

  let mint = new Mint(transaction.id.toString() + pool.txCount.toString())
  mint.transaction = transaction.id
  mint.timestamp = transaction.timestamp
  mint.pool = pool.id
  mint.owner = event.params.owner
  mint.sender = event.params.sender
  mint.origin = event.transaction.from
  mint.amount = event.params.amount
  mint.amount0 = amount0
  mint.amount1 = amount1
  // @todo replace this with real USD
  mint.amountUSD = ZERO_BD
  mint.tickLower = BigInt.fromI32(event.params.tickLower as i32)
  mint.tickUpper = BigInt.fromI32(event.params.tickUpper as i32)
  mint.logIndex = event.logIndex

  // @todo need LP stuff

  token0.save()
  token1.save()
  pool.save()
  factory.save()
  mint.save()
}

export function handleBurn(event: PoolBurn): void {
  let pool = Pool.load(event.address.toHexString())
  let factory = Factory.load(FACTORY_ADDRESS)

  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  // update globals
  factory.transactionCount = factory.transactionCount.plus(ONE_BI)

  // update token0 data
  token0.txCount = token0.txCount.plus(ONE_BI)
  token0.totalValueLocked = token0.totalValueLocked.minus(amount0)
  // todo - usd + derived prices

  // update token1 data
  token1.txCount = token1.txCount.plus(ONE_BI)
  token1.totalValueLocked = token1.totalValueLocked.minus(amount1)
  // todo - usd + derived prices

  // pool data
  pool.txCount = pool.txCount.plus(ONE_BI)
  pool.liquidity = pool.liquidity.minus(event.params.amount)
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(amount1)

  let transaction = loadTransaction(event)

  let burn = new Burn(transaction.id.toString() + pool.txCount.toString())
  burn.transaction = transaction.id
  burn.timestamp = transaction.timestamp
  burn.pool = pool.id
  burn.owner = event.params.owner
  burn.origin = event.transaction.from
  burn.amount = event.params.amount
  burn.amount0 = amount0
  burn.amount1 = amount1
  // @todo replace this with real USD
  burn.amountUSD = ZERO_BD
  burn.tickLower = BigInt.fromI32(event.params.tickLower as i32)
  burn.tickUpper = BigInt.fromI32(event.params.tickUpper as i32)
  burn.logIndex = event.logIndex

  // @todo need LP stuff

  token0.save()
  token1.save()
  pool.save()
  factory.save()
  burn.save()
}

export function handleSwap(event: Swap): void {
  let pool = Pool.load(event.address.toHexString())
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)

  // amounts
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  // update pool data
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
  pool.volumeToken0 = pool.volumeToken0.plus(amount0)
  pool.volumeToken1 = pool.volumeToken1.plus(amount1)
  pool.tick = BigInt.fromI32(event.params.tick as i32)
  pool.txCount = pool.txCount.plus(ONE_BI)

  const prices = calculatePrice(pool.sqrtPrice)
  pool.token0Price = prices[0]
  pool.token1Price = prices[1]

  // update token0 data
  token0.volume = token0.volume.plus(amount0)
  token0.totalValueLocked = token0.totalValueLocked.plus(amount0)

  // update token1 data
  token1.volume = token1.volume.plus(amount1)
  token1.totalValueLocked = token1.totalValueLocked.plus(amount1)

  pool.save()
  token0.save()
  token1.save()
}
