/* eslint-disable prefer-const */
import { Bundle, Factory, Mint, Pool, Token } from '../../types/schema'
import { BigInt } from '@graphprotocol/graph-ts'
import { Mint as MintEvent } from '../../types/templates/Pool/Pool'
import { convertTokenToDecimal, loadTransaction } from '../../utils'
import { updateDerivedTVLAmounts } from '../../utils/tvl'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateTokenHourData,
  updateUniswapDayData
} from '../../utils/intervalUpdates'
import { FACTORY_ADDRESS, ONE_BI } from '../../utils/constants'

export function handleMint(event: MintEvent): void {
  let bundle = Bundle.load('1')
  let poolAddress = event.address.toHexString()
  let pool = Pool.load(poolAddress)
  let factory = Factory.load(FACTORY_ADDRESS)
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)

  // Parse amounts.
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  let amountUSD = amount0
    .times(token0.derivedETH.times(bundle.ethPriceUSD))
    .plus(amount1.times(token1.derivedETH.times(bundle.ethPriceUSD)))

  // Transaction count updates.
  token0.txCount = token0.txCount.plus(ONE_BI)
  token1.txCount = token1.txCount.plus(ONE_BI)
  pool.txCount = pool.txCount.plus(ONE_BI)
  factory.txCount = factory.txCount.plus(ONE_BI)

  // Update TVL values.
  let oldPoolTVLETH = pool.totalValueLockedETH
  let oldPoolTVLETHUntracked = pool.totalValueLockedETHUntracked
  token0.totalValueLocked = token0.totalValueLocked.plus(amount0)
  token1.totalValueLocked = token1.totalValueLocked.plus(amount1)
  pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
  pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
  updateDerivedTVLAmounts(pool as Pool, factory as Factory, oldPoolTVLETH, oldPoolTVLETHUntracked)

  // Pools liquidity tracks the currently active liquidity given pools current tick.
  // We only want to update it on mint if the new position includes the current tick.
  if (
    pool.tick !== null &&
    BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
    BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
  ) {
    pool.liquidity = pool.liquidity.plus(event.params.amount)
  }

  pool.liquidityProviderCount = pool.liquidityProviderCount.plus(ONE_BI)

  let transaction = loadTransaction(event)
  let mint = new Mint(transaction.id.toString() + '#' + pool.txCount.toString())
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
  mint.save()
}
