/* eslint-disable prefer-const */
import { Bundle, Pool, Token } from '../../types/schema'
import { BigInt } from '@graphprotocol/graph-ts'
import { Initialize } from '../../types/templates/Pool/Pool'
import { findEthPerToken, getEthPriceInUSD } from '../../utils/pricing'

export function handleInitialize(event: Initialize): void {
  let pool = Pool.load(event.address.toHexString())

  if (pool === null) {
    return
  }

  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.tick = BigInt.fromI32(event.params.tick)

  // Update token prices.
  let token0 = Token.load(pool.token0)
  let token1 = Token.load(pool.token1)

  // Update ETH price now that prices could have changed.
  let bundle = Bundle.load('1')

  if (bundle === null || token0 === null || token1 === null) {
    return
  }

  bundle.ethPriceUSD = getEthPriceInUSD()
  bundle.save()

  // Update token prices.
  token0.derivedETH = findEthPerToken(token0)
  token1.derivedETH = findEthPerToken(token1)

  // Save entities.
  token0.save()
  token1.save()
  pool.save()
}
