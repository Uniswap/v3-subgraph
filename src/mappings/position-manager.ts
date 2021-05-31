import {
  Collect,
  DecreaseLiquidity,
  IncreaseLiquidity,
  NonfungiblePositionManager,
  Transfer
} from '../types/NonfungiblePositionManager/NonfungiblePositionManager'
import { Position, Token } from '../types/schema'
import { ADDRESS_ZERO, factoryContract, ZERO_BD, ZERO_BI } from '../utils/constants'
import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'
import { convertTokenToDecimal, loadTransaction } from '../utils'
import { fetchTokenDecimals } from '../utils/token'

function getPosition(event: ethereum.Event, tokenId: BigInt): Position {
  let position = Position.load(tokenId.toString())
  if (position === null) {
    let contract = NonfungiblePositionManager.bind(event.address)
    let positionResult = contract.positions(tokenId)

    let poolAddress = factoryContract.getPool(positionResult.value2, positionResult.value3, positionResult.value4)

    position = new Position(tokenId.toString())
    // The owner gets correctly updated in the Transfer handler
    position.owner = Address.fromString(ADDRESS_ZERO)
    position.pool = poolAddress.toHexString()
    position.token0 = positionResult.value2.toHexString()
    position.token1 = positionResult.value3.toHexString()
    position.tickLower = BigInt.fromI32(positionResult.value5)
    position.tickUpper = BigInt.fromI32(positionResult.value6)
    position.liquidity = ZERO_BI
    position.depositedToken0 = ZERO_BD
    position.depositedToken1 = ZERO_BD
    position.withdrawnToken0 = ZERO_BD
    position.withdrawnToken1 = ZERO_BD
    position.collectedFeesToken0 = ZERO_BD
    position.collectedFeesToken1 = ZERO_BD
    position.transaction = loadTransaction(event).id
  }

  return position!
}

export function handleIncreaseLiquidity(event: IncreaseLiquidity): void {
  // let position = getPosition(event, event.params.tokenId)
  // let decimals0 = fetchTokenDecimals(Address.fromString(position.token0))
  // let decimals1 = fetchTokenDecimals(Address.fromString(position.token1))
  // let amount0 = convertTokenToDecimal(event.params.amount0, decimals0)
  // let amount1 = convertTokenToDecimal(event.params.amount1, decimals1)
  // position.liquidity = position.liquidity.plus(event.params.liquidity)
  // position.depositedToken0 = position.depositedToken0.plus(amount0)
  // position.depositedToken1 = position.depositedToken1.plus(amount1)
  // position.save()
}

export function handleDecreaseLiquidity(event: DecreaseLiquidity): void {
  // let position = getPosition(event, event.params.tokenId)
  // let token0 = Token.load(position.token0)
  // let token1 = Token.load(position.token1)
  // let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  // let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  // position.liquidity = position.liquidity.plus(event.params.liquidity)
  // position.withdrawnToken0 = position.withdrawnToken0.plus(amount0)
  // position.withdrawnToken1 = position.withdrawnToken1.plus(amount1)
  // position.save()
}

export function handleCollect(event: Collect): void {
  let position = getPosition(event, event.params.tokenId)
  let token0 = Token.load(position.token0)
  let token1 = Token.load(position.token1)
  let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
  let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)
  position.collectedFeesToken0 = position.collectedFeesToken0.plus(amount0)
  position.collectedFeesToken1 = position.collectedFeesToken1.plus(amount1)
  position.save()
}

export function handleTransfer(event: Transfer): void {
  // let position = getPosition(event, event.params.tokenId)
  // position.owner = event.params.to
  // position.save()
}
