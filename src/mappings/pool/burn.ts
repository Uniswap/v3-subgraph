import { BigInt } from '@graphprotocol/graph-ts'

import { Pool, Token } from '../../types/schema'
import { Burn as BurnEvent } from '../../types/templates/Pool/Pool'

export function handleBurn(event: BurnEvent): void {
  handleBurnHelper(event)
}

// Note: this handler need not adjust TVL because that is accounted for in the handleCollect handler
export function handleBurnHelper(event: BurnEvent): void {
  const poolAddress = event.address.toHexString()
  const pool = Pool.load(poolAddress)!

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  if (token0 && token1) {
    // Pools liquidity tracks the currently active liquidity given pools current tick.
    // We only want to update it on burn if the position being burnt includes the current tick.
    if (
      pool.tick !== null &&
      BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
      BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
    ) {
      // todo: this liquidity can be calculated from the real reserves and
      // current price instead of incrementally from every burned amount which
      // may not be accurate: https://linear.app/uniswap/issue/DAT-336/fix-pool-liquidity
      pool.liquidity = pool.liquidity.minus(event.params.amount)
    }

    token0.save()
    token1.save()
    pool.save()
  }
}
