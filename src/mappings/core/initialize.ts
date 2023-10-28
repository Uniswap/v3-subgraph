import { Bundle, Pool, Token } from '../../../generated/schema'
import { BigInt } from '@graphprotocol/graph-ts'
import { Initialize } from '../../../generated/templates/Pool/Pool'

import { findEthPerToken, getEthPriceInUSD, getTrackedAmountUSD, sqrtPriceX96ToTokenPrices } from '../../utils/pricing'
import { updatePoolDayData, updatePoolHourData } from '../../utils/intervalUpdates'

export function handleInitialize(event: Initialize): void {
  // update pool sqrt price and tick
  let pool = Pool.load(event.address.toHexString())
  if (pool) {
    pool.sqrtPrice = event.params.sqrtPriceX96
    pool.tick = BigInt.fromI32(event.params.tick)
    pool.save()

    // update token prices
    let token0 = Token.load(pool.token0)
    let token1 = Token.load(pool.token1)

    // update ETH price now that prices could have changed
    let bundle = Bundle.load('1')
    if (bundle) {
      bundle.ethPriceUSD = getEthPriceInUSD()
      bundle.save()
    }

    updatePoolDayData(event)
    updatePoolHourData(event)
    if (token0 && token1) {
      // update token prices
      token0.derivedETH = findEthPerToken(token0 as Token)
      token1.derivedETH = findEthPerToken(token1 as Token)
      token0.save()
      token1.save()
    }
  }
}
