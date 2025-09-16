import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'

import {
  Collect,
  DecreaseLiquidity,
  IncreaseLiquidity,
  NonfungiblePositionManager,
  Transfer,
} from '../../../generated/NonfungiblePositionManager/NonfungiblePositionManager'
import { Position, PositionSnapshot, Token, Tick } from '../../../generated/schema'
import { ADDRESS_ZERO, factoryContract, ZERO_BD, ZERO_BI } from '../../common/constants'
import { convertTokenToDecimal } from '../../common/utils'
import { loadTransaction } from './utils'

function getPosition(event: ethereum.Event, tokenId: BigInt): Position | null {
  let position = Position.load(tokenId.toString())
  if (position === null) {
    const contract = NonfungiblePositionManager.bind(event.address)
    const positionCall = contract.try_positions(tokenId)

    if (!positionCall.reverted) {
      const positionResult = positionCall.value
      const poolAddress = factoryContract.getPool(positionResult.value2, positionResult.value3, positionResult.value4)

      position = new Position(tokenId.toString())
      position.owner = Address.fromString(ADDRESS_ZERO)
      position.pool = poolAddress
      position.token0 = positionResult.value2
      position.token1 = positionResult.value3
      const tickLowerIdx = positionResult.value5
      const tickUpperIdx = positionResult.value6
      const tickLowerId = poolAddress.toHexString().concat('#').concat(tickLowerIdx.toString())
      const tickUpperId = poolAddress.toHexString().concat('#').concat(tickUpperIdx.toString())

      // Load or create tick entities
      let tickLower = Tick.load(tickLowerId)
      let tickUpper = Tick.load(tickUpperId)

      if (!tickLower) {
        tickLower = new Tick(tickLowerId)
        tickLower.tickIdx = BigInt.fromI32(tickLowerIdx)
        tickLower.pool = poolAddress
        tickLower.poolAddress = poolAddress
        tickLower.liquidityGross = ZERO_BI
        tickLower.liquidityNet = ZERO_BI
        tickLower.price0 = ZERO_BD
        tickLower.price1 = ZERO_BD
        tickLower.createdAtTimestamp = event.block.timestamp
        tickLower.createdAtBlockNumber = event.block.number
        tickLower.save()
      }

      if (!tickUpper) {
        tickUpper = new Tick(tickUpperId)
        tickUpper.tickIdx = BigInt.fromI32(tickUpperIdx)
        tickUpper.pool = poolAddress
        tickUpper.poolAddress = poolAddress
        tickUpper.liquidityGross = ZERO_BI
        tickUpper.liquidityNet = ZERO_BI
        tickUpper.price0 = ZERO_BD
        tickUpper.price1 = ZERO_BD
        tickUpper.createdAtTimestamp = event.block.timestamp
        tickUpper.createdAtBlockNumber = event.block.number
        tickUpper.save()
      }

      position.tickLower = tickLowerId
      position.tickUpper = tickUpperId
      position.liquidity = ZERO_BI
      position.depositedToken0 = ZERO_BD
      position.depositedToken1 = ZERO_BD
      position.withdrawnToken0 = ZERO_BD
      position.withdrawnToken1 = ZERO_BD
      position.collectedToken0 = ZERO_BD
      position.collectedToken1 = ZERO_BD
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
  const positionManagerContract = NonfungiblePositionManager.bind(event.address)
  const positionResult = positionManagerContract.try_positions(tokenId)
  if (!positionResult.reverted) {
    position.feeGrowthInside0LastX128 = positionResult.value.value8
    position.feeGrowthInside1LastX128 = positionResult.value.value9
  }
  return position
}

function savePositionSnapshot(position: Position, event: ethereum.Event): void {
  const positionSnapshot = new PositionSnapshot(position.id.concat('#').concat(event.block.number.toString()))
  positionSnapshot.owner = position.owner
  positionSnapshot.pool = position.pool
  positionSnapshot.position = position.id
  positionSnapshot.blockNumber = event.block.number
  positionSnapshot.timestamp = event.block.timestamp
  positionSnapshot.liquidity = position.liquidity
  positionSnapshot.depositedToken0 = position.depositedToken0
  positionSnapshot.depositedToken1 = position.depositedToken1
  positionSnapshot.withdrawnToken0 = position.withdrawnToken0
  positionSnapshot.withdrawnToken1 = position.withdrawnToken1
  positionSnapshot.collectedFeesToken0 = position.collectedFeesToken0
  positionSnapshot.collectedFeesToken1 = position.collectedFeesToken1
  positionSnapshot.transaction = loadTransaction(event).id
  positionSnapshot.feeGrowthInside0LastX128 = position.feeGrowthInside0LastX128
  positionSnapshot.feeGrowthInside1LastX128 = position.feeGrowthInside1LastX128
  positionSnapshot.save()
}

export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
  const position = getPosition(event, event.params.tokenId)

  if (position == null) {
    return
  }

  const token0 = Token.load(position.token0)
  const token1 = Token.load(position.token1)

  if (!token0 || !token1) {
    return
  }

  const amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  const amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  position.liquidity = position.liquidity.plus(event.params.liquidity)
  position.depositedToken0 = position.depositedToken0.plus(amount0)
  position.depositedToken1 = position.depositedToken1.plus(amount1)

  updateFeeVars(position, event, event.params.tokenId)

  position.save()

  savePositionSnapshot(position, event)
}

export function handleDecreaseLiquidity(event: DecreaseLiquidity): void {
  let position = getPosition(event, event.params.tokenId)

  if (position == null) {
    return
  }

  const token0 = Token.load(position.token0)
  const token1 = Token.load(position.token1)

  if (!token0 || !token1) {
    return
  }

  const amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  const amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  position.liquidity = position.liquidity.minus(event.params.liquidity)
  position.withdrawnToken0 = position.withdrawnToken0.plus(amount0)
  position.withdrawnToken1 = position.withdrawnToken1.plus(amount1)

  position = updateFeeVars(position, event, event.params.tokenId)

  position.save()

  savePositionSnapshot(position, event)
}

export function handleCollect(event: Collect): void {
  let position = getPosition(event, event.params.tokenId)

  if (position == null) {
    return
  }

  const token0 = Token.load(position.token0)
  const token1 = Token.load(position.token1)

  if (!token0 || !token1) {
    return
  }

  const amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  const amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  position.collectedToken0 = position.collectedToken0.plus(amount0)
  position.collectedToken1 = position.collectedToken1.plus(amount1)

  position.collectedFeesToken0 = position.collectedToken0.minus(position.withdrawnToken0)
  position.collectedFeesToken1 = position.collectedToken1.minus(position.withdrawnToken1)

  position = updateFeeVars(position, event, event.params.tokenId)

  position.save()

  savePositionSnapshot(position, event)
}

export function handleTransfer(event: Transfer): void {
  const position = getPosition(event, event.params.tokenId)

  if (position == null) {
    return
  }

  position.owner = event.params.to
  position.save()

  savePositionSnapshot(position, event)
}
