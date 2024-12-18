import { BigDecimal } from '@graphprotocol/graph-ts'

import { Token } from './../types/schema'
import { ONE_BD, ZERO_BD } from './constants'

const WETH_ADDRESS = '0x5300000000000000000000000000000000000004'
const USDC_ADDRESS = '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4'
const USDT_ADDRESS = '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df'
const DAI_ADDRESS = '0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97'

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
