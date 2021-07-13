/* eslint-disable prefer-const */
import {
  Collect,
  DecreaseLiquidity,
  IncreaseLiquidity,
  NonfungiblePositionManager,
  Transfer
} from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import { Bundle, Pool, Position, PositionSnapshot, Token } from '../types/schema'
import {
  ADDRESS_ZERO,
  factoryContract,
  ZERO_BD,
  ZERO_BI
} from '../utils/constants'
import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { convertTokenToDecimal, loadTransaction } from '../utils'

function getPosition(event: ethereum.Event, tokenId: BigInt): Position | null {
  let position = Position.load(tokenId.toString())
  if (position === null) {
    let contract = NonfungiblePositionManager.bind(event.address)
    let positionCall = contract.try_positions(tokenId)

    // the following call reverts in situations where the position is minted
    // and deleted in the same block - from my investigation this happens
    // in calls from  BancorSwap
    // (e.g. 0xf7867fa19aa65298fadb8d4f72d0daed5e836f3ba01f0b9b9631cdc6c36bed40)
    if (!positionCall.reverted) {
      let positionResult = positionCall.value
      let poolAddress = factoryContract.getPool(positionResult.value2, positionResult.value3, positionResult.value4)

      position = new Position(tokenId.toString())
      // The owner gets correctly updated in the Transfer handler
      position.owner = Address.fromString(ADDRESS_ZERO)
      position.pool = poolAddress.toHexString()
      position.token0 = positionResult.value2.toHexString()
      position.token1 = positionResult.value3.toHexString()
      position.tickLower = position.pool.concat('#').concat(positionResult.value5.toString())
      position.tickUpper = position.pool.concat('#').concat(positionResult.value6.toString())
      position.liquidity = ZERO_BI
      position.depositedToken0 = ZERO_BD
      position.depositedToken1 = ZERO_BD
      position.withdrawnToken0 = ZERO_BD
      position.withdrawnToken1 = ZERO_BD
      position.collectedFeesToken0 = ZERO_BD
      position.collectedFeesToken1 = ZERO_BD
      position.transaction = loadTransaction(event).id
      position.feeGrowthInside0LastX128 = positionResult.value8
      position.feeGrowthInside1LastX128 = positionResult.value9
    }
  }

  return position
}

function updateFeeVars(position: Position, event: ethereum.Event, tokenId: BigInt): Position {
  let positionManagerContract = NonfungiblePositionManager.bind(event.address)
  let positionResult = positionManagerContract.try_positions(tokenId)
  if (!positionResult.reverted) {
    position.feeGrowthInside0LastX128 = positionResult.value.value8
    position.feeGrowthInside1LastX128 = positionResult.value.value9
  }
  return position
}
export function savePositionSnapshot(position: Position, event: ethereum.Event): void {
  let timestamp = event.block.timestamp.toI32()
  let bundle = Bundle.load('1')
  let pool = Pool.load(position.pool)
  // log.warning("In handle transfer, pool token0 token1 {}", [position.pool, pool.token0, pool.token1])
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)

  if (pool == null || token0 == null || token1 == null) {
    return
  }

  // create new snapshot
  let snapshot = new PositionSnapshot(position.id.concat("#").concat(timestamp.toString()))
  snapshot.position = position.id
  snapshot.timestamp = timestamp
  snapshot.blockNumber = event.block.number
  snapshot.owner = position.owner
  snapshot.pool = position.pool
  snapshot.token0Price = pool.token0Price
  snapshot.token1Price = pool.token1Price
  snapshot.token0PriceUSD = token0.derivedETH.times(bundle.ethPriceUSD)
  snapshot.token1PriceUSD = token1.derivedETH.times(bundle.ethPriceUSD)
  snapshot.sqrtPrice = pool.sqrtPrice
  snapshot.liquidity = pool.liquidity
  snapshot.totalValueLockedETH = pool.totalValueLockedETH
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD
  snapshot.depositedToken0 = position.depositedToken0
  snapshot.depositedToken1 = position.depositedToken1
  snapshot.withdrawnToken0 = position.withdrawnToken0
  snapshot.withdrawnToken1 = position.withdrawnToken1
  snapshot.collectedFeesToken0 = position.collectedFeesToken0
  snapshot.collectedFeesToken1 = position.collectedFeesToken1
  snapshot.tick = pool.tick
  snapshot.transaction = loadTransaction(event).id
  snapshot.feeGrowthInside0LastX128 = position.feeGrowthInside0LastX128
  snapshot.feeGrowthInside1LastX128 = position.feeGrowthInside1LastX128
  snapshot.save()
}

export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
  let position = getPosition(event, event.params.tokenId)

  // position was not able to be fetched
  if (position == null) {
    return
  }

  // temp fix
  if (Address.fromString(position.pool).equals(Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248'))) {
    return
  }

  let token0 = Token.load(position.token0)
  let token1 = Token.load(position.token1)

  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  position.liquidity = position.liquidity.plus(event.params.liquidity)
  position.depositedToken0 = position.depositedToken0.plus(amount0)
  position.depositedToken1 = position.depositedToken1.plus(amount1)

  updateFeeVars(position!, event, event.params.tokenId)
  position.save()

  savePositionSnapshot(position!, event)
}

export function handleDecreaseLiquidity(event: DecreaseLiquidity): void {
  let position = getPosition(event, event.params.tokenId)

  // position was not able to be fetched
  if (position == null) {
    return
  }

  // temp fix
  if (Address.fromString(position.pool).equals(Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248'))) {
    return
  }

  let token0 = Token.load(position.token0)
  let token1 = Token.load(position.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  position.liquidity = position.liquidity.minus(event.params.liquidity)
  position.withdrawnToken0 = position.withdrawnToken0.plus(amount0)
  position.withdrawnToken1 = position.withdrawnToken1.plus(amount1)

  position = updateFeeVars(position!, event, event.params.tokenId)
  position.save()

  savePositionSnapshot(position!, event)
}

export function handleCollect(event: Collect): void {
  let position = getPosition(event, event.params.tokenId)

  // position was not able to be fetched
  if (position == null) {
    return
  }

  // temp fix
  if (Address.fromString(position.pool).equals(Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248'))) {
    return
  }

  let token0 = Token.load(position.token0)
  let token1 = Token.load(position.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  position.collectedFeesToken0 = position.collectedFeesToken0.plus(amount0)
  position.collectedFeesToken1 = position.collectedFeesToken1.plus(amount1)

  position = updateFeeVars(position!, event, event.params.tokenId)
  position.save()

  savePositionSnapshot(position!, event)
}

export function handleTransfer(event: Transfer): void {
  let position = getPosition(event, event.params.tokenId)

  // position was not able to be fetched
  if (position == null) {
    return
  }

  // Check if pool exists - if not, create
  position.owner = event.params.to
  position.save()

  let pool = Pool.load(position.pool)
  if (pool == null) {
    log.warning("In handle transfer, tx hash, pool does not exist yet {}", [position.pool])
    return
  }


  savePositionSnapshot(position!, event)
}
