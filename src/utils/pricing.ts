import { BigDecimal } from '@graphprotocol/graph-ts'

import { Token } from './../types/schema'
import { ONE_BD, ZERO_BD } from './constants'

const WETH_ADDRESS = '0x0dc808adce2099a9f62aa87d9670745aba741746'
const USDC_ADDRESS = '0xb73603c5d87fa094b7314c74ace2e64d165016fb'
const USDT_ADDRESS = '0xf417f5a458ec102b90352f697d6e2ac3a3d2851f'
const DAI_ADDRESS = '0x1c466b9371f8aba0d7c458be10a62192fcb8aa71'

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [WETH_ADDRESS, USDC_ADDRESS, USDT_ADDRESS, DAI_ADDRESS]

export const STABLE_COINS: string[] = [USDC_ADDRESS, USDT_ADDRESS, DAI_ADDRESS]

export const MINIMUM_ETH_LOCKED = BigDecimal.fromString('60')

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findNativePerToken(token: Token, wrappedNativeAddress: string): BigDecimal {
  if (token.id == wrappedNativeAddress) {
    return ONE_BD
  }
  return ZERO_BD
}
