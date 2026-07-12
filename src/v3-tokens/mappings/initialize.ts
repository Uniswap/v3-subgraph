import { BigInt } from '@graphprotocol/graph-ts'

import { Bundle, Token } from '../../../generated/schema'
import { Initialize } from '../../../generated/templates/Pool/Pool'
import { getPool } from '../../common/entityGetters'
import {
  findEthPerToken,
  getEthPriceInUSD,
  PricingContext,
  sqrtPriceX96ToTokenPrices,
  updatePricingRevision,
} from '../../common/pricing'

export function handleInitialize(event: Initialize): void {
  // update pool sqrt price and tick
  const pool = getPool(event.address)
  if (pool) {
    pool.sqrtPrice = event.params.sqrtPriceX96
    pool.tick = BigInt.fromI32(event.params.tick)

    // update token prices
    const token0 = Token.load(pool.token0)
    const token1 = Token.load(pool.token1)
    if (token0 && token1) {
      const prices = sqrtPriceX96ToTokenPrices(event.params.sqrtPriceX96, token0 as Token, token1 as Token)
      pool.token0Price = prices[0]
      pool.token1Price = prices[1]
    }
    pool.save()

    // update ETH price now that prices could have changed
    const bundle = Bundle.load('1')
    if (bundle) {
      bundle.ethPriceUSD = getEthPriceInUSD()

      if (token0 && token1) {
        const pricingContext = new PricingContext(pool, token0 as Token, token1 as Token)
        const token0DerivedETH = findEthPerToken(token0 as Token, bundle, pricingContext)
        const token1DerivedETH = findEthPerToken(token1 as Token, bundle, pricingContext)
        updatePricingRevision(
          bundle,
          token0 as Token,
          token0.derivedETH,
          token0DerivedETH,
          token1 as Token,
          token1.derivedETH,
          token1DerivedETH
        )
        token0.derivedETH = token0DerivedETH
        token1.derivedETH = token1DerivedETH
        token0.save()
        token1.save()
      }
      bundle.save()
    }
  }
}
