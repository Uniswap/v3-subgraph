import { BigInt } from '@graphprotocol/graph-ts'

import { Bundle, Pool, Token } from '../../types/schema'
import { Initialize } from '../../types/templates/Pool/Pool'
import { getSubgraphConfig, SubgraphConfig } from '../../utils/chains'
import { updatePoolDayData, updatePoolHourData } from '../../utils/intervalUpdates'
import { findNativePerToken, getNativePriceInUSD } from '../../utils/pricing'

export function handleInitialize(event: Initialize): void {
  handleInitializeHelper(event)
}

export function handleInitializeHelper(event: Initialize, subgraphConfig: SubgraphConfig = getSubgraphConfig()): void {
  const stablecoinWrappedNativePoolAddress = subgraphConfig.stablecoinWrappedNativePoolAddress
  const stablecoinIsToken0 = subgraphConfig.stablecoinIsToken0
  const wrappedNativeAddress = subgraphConfig.wrappedNativeAddress
  const stablecoinAddresses = subgraphConfig.stablecoinAddresses
  const minimumNativeLocked = subgraphConfig.minimumNativeLocked

  // update pool sqrt price and tick
  const pool = Pool.load(event.address.toHexString())!
  pool.sqrtPrice = event.params.sqrtPriceX96
  pool.tick = BigInt.fromI32(event.params.tick)
  pool.save()

  // update token prices
  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)

  // update ETH price now that prices could have changed
  const bundle = Bundle.load('1')!
  bundle.ethPriceUSD = getNativePriceInUSD(stablecoinWrappedNativePoolAddress, stablecoinIsToken0)
  bundle.save()

  updatePoolDayData(event)
  updatePoolHourData(event)

  // update token prices
  if (token0 && token1) {
    token0.derivedETH = findNativePerToken(
      token0 as Token,
      wrappedNativeAddress,
      stablecoinAddresses,
      minimumNativeLocked,
    )
    token1.derivedETH = findNativePerToken(
      token1 as Token,
      wrappedNativeAddress,
      stablecoinAddresses,
      minimumNativeLocked,
    )
    token0.save()
    token1.save()
  }
}
