import {
  Collect,
  DecreaseLiquidity,
  IncreaseLiquidity,
  NonfungiblePositionManager
} from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import { Position, Token } from '../types/schema'
import { factoryContract, ZERO_BD, ZERO_BI } from '../utils/constants'
import { BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { convertTokenToDecimal, loadTransaction } from '../utils'

function initializePosition(event: ethereum.Event, tokenId: BigInt): Position | null {
  let contract = NonfungiblePositionManager.bind(event.address)
  let positionResult = contract.try_positions(tokenId)
  if (positionResult.reverted) {
    log.error('fetching position failed', [])
    return null
  }

  let poolResult = factoryContract.try_getPool(
    positionResult.value.value2,
    positionResult.value.value3,
    positionResult.value.value4
  )
  if (poolResult.reverted) {
    log.error('fetching pool failed', [])
    return null
  }

  let position = new Position(tokenId.toString())
  position.operator = positionResult.value.value1
  position.pool = poolResult.value.toHexString()
  position.token0 = positionResult.value.value2.toHexString()
  position.token1 = positionResult.value.value3.toHexString()
  position.tickLower = BigInt.fromI32(positionResult.value.value5)
  position.tickUpper = BigInt.fromI32(positionResult.value.value6)
  position.liquidity = ZERO_BI
  position.depositedToken0 = ZERO_BD
  position.depositedToken1 = ZERO_BD
  position.withdrawnToken0 = ZERO_BD
  position.withdrawnToken1 = ZERO_BD
  position.collectedFeesToken0 = ZERO_BD
  position.collectedFeesToken1 = ZERO_BD
  position.transaction = loadTransaction(event).id

  return position
}

export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
  let position = Position.load(event.params.tokenId.toString())
  if (position === null) {
    position = initializePosition(event, event.params.tokenId)
    if (position === null) return
  }

  let token0 = Token.load(position.token0)
  let token1 = Token.load(position.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  position.liquidity = position.liquidity.plus(event.params.liquidity)
  position.depositedToken0 = position.depositedToken0.plus(amount0)
  position.depositedToken1 = position.depositedToken1.plus(amount1)

  position.save()
}

export function handleDecreaseLiquidity(event: DecreaseLiquidity): void {
  let position = Position.load(event.params.tokenId.toString())
  let token0 = Token.load(position.token0)
  let token1 = Token.load(position.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  position.liquidity = position.liquidity.plus(event.params.liquidity)
  position.withdrawnToken0 = position.withdrawnToken0.plus(amount0)
  position.withdrawnToken1 = position.withdrawnToken1.plus(amount1)

  position.save()
}

export function handleCollect(event: Collect): void {
  let position = Position.load(event.params.tokenId.toString())
  let token0 = Token.load(position.token0)
  let token1 = Token.load(position.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)

  position.collectedFeesToken0 = position.collectedFeesToken0.plus(amount0)
  position.collectedFeesToken1 = position.collectedFeesToken1.plus(amount1)

  position.save()
}
