/* eslint-disable prefer-const */
import { FACTORY_ADDRESS, ZERO_BI, ONE_BI, ZERO_BD } from './../utils/constants'
import { Factory } from '../types/schema'
import { PoolCreated } from '../types/Factory/Factory'
import { Pool, Token, Bundle } from '../types/schema'
import { Pool as PoolTemplate } from '../types/templates'
import { fetchTokenSymbol, fetchTokenName, fetchTokenTotalSupply, fetchTokenDecimals } from '../utils/token'
import { log, BigInt } from '@graphprotocol/graph-ts'

export function handlePoolCreated(event: PoolCreated): void {
  // load factory (create if first exchange)
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.poolCount = ZERO_BI
    factory.totalVolumeETH = ZERO_BD
    factory.totalLiquidityETH = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.combinedVolumeUSD = ZERO_BD
    factory.totalLiquidityUSD = ZERO_BD
    factory.txCount = ZERO_BI

    // create new bundle
    let bundle = new Bundle('1')
    bundle.ethPrice = ZERO_BD
    bundle.save()
  }

  factory.poolCount = factory.poolCount.plus(ONE_BI);

  let pool = new Pool(event.params.pool.toHexString()) as Pool
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.token0)
    token0.name = fetchTokenName(event.params.token0)
    token0.totalSupply = fetchTokenTotalSupply(event.params.token0)
    let decimals = fetchTokenDecimals(event.params.token0)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals
    token0.derivedETH = ZERO_BD
    token0.tradeVolume = ZERO_BD
    token0.tradeVolumeUSD = ZERO_BD
    token0.untrackedVolumeUSD = ZERO_BD
    token0.combinedVolumeUSD = ZERO_BD
    token0.totalLiquidity = ZERO_BD
    token0.txCount = ZERO_BI
    token0.poolCount = ZERO_BI
  }

  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.token0)
    token1.name = fetchTokenName(event.params.token0)
    token1.totalSupply = fetchTokenTotalSupply(event.params.token0)
    let decimals = fetchTokenDecimals(event.params.token0)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token1.decimals = decimals
    token1.derivedETH = ZERO_BD
    token1.tradeVolume = ZERO_BD
    token1.tradeVolumeUSD = ZERO_BD
    token1.untrackedVolumeUSD = ZERO_BD
    token1.combinedVolumeUSD = ZERO_BD
    token1.totalLiquidity = ZERO_BD
    token1.txCount = ZERO_BI
    token1.poolCount = ZERO_BI
  }

  pool.token0 = token0.id
  pool.token1 = token1.id

  pool.feeTier = BigInt.fromI32(event.params.fee);
  pool.tickSpacing = BigInt.fromI32(event.params.tickSpacing);
  pool.createdAtTimestamp = event.block.timestamp
  pool.createdAtBlockNumber = event.block.number

  pool.liquidity = ZERO_BD
  pool.sqrtPrice = ZERO_BD

  pool.liquidityProviderCount = ZERO_BI
  pool.txCount = ZERO_BI

  pool.reserve0 = ZERO_BD
  pool.reserve1 = ZERO_BD
  pool.trackedReserveETH = ZERO_BD
  pool.reserveETH = ZERO_BD
  pool.reserveUSD = ZERO_BD

  pool.volumeToken0 = ZERO_BD
  pool.volumeToken1 = ZERO_BD
  pool.volumeUSD = ZERO_BD
  pool.combinedVolumeUSD = ZERO_BD // SOMMELIER: tracked and untracked volume combined
  pool.untrackedVolumeUSD = ZERO_BD

  pool.uncollectedFeesToken0 = ZERO_BD
  pool.uncollectedFeesToken1 = ZERO_BD
  pool.uncollectedFeesUSD = ZERO_BD
  pool.collectedFeesToken0 = ZERO_BD
  pool.collectedFeesToken1 = ZERO_BD
  pool.collectedFeesUSD = ZERO_BD

  pool.token0Price = ZERO_BD
  pool.token1Price = ZERO_BD

  // create the tracked contract based on the template
  PoolTemplate.create(event.params.pool)

  // save updated values
  pool.save()
  token0.save()
  token1.save()
  factory.save()
}
