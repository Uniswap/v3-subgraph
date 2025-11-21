import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x204faca1764b154221e35c0d20abb3c525710498'

export const REFERENCE_TOKEN = '0x3bd359c1119da7da1d913d1c4d2b7c461115433a' // WMON
export const STABLE_TOKEN_POOL = '0x659bd0bc4167ba25c62e05656f78043e7ed4a9da'

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('100000')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [
  '0x3bd359c1119da7da1d913d1c4d2b7c461115433a', // WMON
  '0x754704bc059f8c67012fed69bc8a327a5aafb603', // USDC
  '0x00000000efe302beaa2b3e6e1b18d08d69a9012a', // AUSD
  '0xe7cd86e13ac4309349f30b3435a9d337750fc82d', // USDT
  '0xee8c0e9f1bffb4eb878d8f15f368a02a35481242', // WETH
  '0xea17e5a9efebf1477db45082d67010e2245217f1' // WSOL
]

export const STABLE_COINS: string[] = [
  '0x754704bc059f8c67012fed69bc8a327a5aafb603', // USDC
  '0x00000000efe302beaa2b3e6e1b18d08d69a9012a', // AUSD
  '0xe7cd86e13ac4309349f30b3435a9d337750fc82d' // USDT
]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
