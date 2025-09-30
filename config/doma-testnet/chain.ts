import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0xF1398cA2C4F1113C5B618D71E4751D2E744f8369'

export const REFERENCE_TOKEN = '0x4200000000000000000000000000000000000006'
export const STABLE_TOKEN_POOL = '0x7CaF1600e0b6396f8AF42B952dc421AfC5602C19'

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('1')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [
  '0x4200000000000000000000000000000000000006', // WETH
  '0x8725f6FDF6E240C303B4e7A60AD13267Fa04d55C', // USDTEST
  '0x2f3463756C59387D6Cd55b034100caf7ECfc757b', // USDC.e
]

export const STABLE_COINS: string[] = [
  '0x8725f6FDF6E240C303B4e7A60AD13267Fa04d55C', // USDTEST
  '0x2f3463756C59387D6Cd55b034100caf7ECfc757b', // USDC.e
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
