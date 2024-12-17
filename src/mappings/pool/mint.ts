import { BigInt } from '@graphprotocol/graph-ts'

import { Pool, Token } from '../../types/schema'
import { Mint as MintEvent } from '../../types/templates/Pool/Pool'

export function handleMint(event: MintEvent): void {
  handleMintHelper(event)
}

export function handleMintHelper(event: MintEvent): void {
  const poolAddress = event.address.toHexString()
  const pool = Pool.load(poolAddress)!

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  if (token0 && token1) {
    // Pools liquidity tracks the currently active liquidity given pools current tick.
    // We only want to update it on mint if the new position includes the current tick.
    if (
      pool.tick !== null &&
      BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
      BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
    ) {
      pool.liquidity = pool.liquidity.plus(event.params.amount)
    }

    token0.save()
    token1.save()
    pool.save()
  }
}
