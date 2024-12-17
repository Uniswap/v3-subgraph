import { BigInt } from '@graphprotocol/graph-ts'

import { Pool, Token } from '../../types/schema'
import { Initialize } from '../../types/templates/Pool/Pool'

export function handleInitialize(event: Initialize): void {
  handleInitializeHelper(event)
}

export function handleInitializeHelper(event: Initialize): void {
  // update pool sqrt price and tick
  const pool = Pool.load(event.address.toHexString())!
  pool.tick = BigInt.fromI32(event.params.tick)
  pool.save()

  // update token prices
  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  // update token prices
  if (token0 && token1) {
    token0.save()
    token1.save()
  }
}
