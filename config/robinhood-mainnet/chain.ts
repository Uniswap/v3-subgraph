import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

// Robinhood chain (chainId 4663). Standard ETH-native config: the reference token is WETH, priced
// via the WETH/USDG pool. USDG ("Global Dollar") is the USD stablecoin (6 decimals).
// NOTE: STABLE_TOKEN_POOL is a zero-address placeholder until the WETH/USDG v3 pool is created and
// seeded. Until it's set, getEthPriceInUSD() returns 0 (USD metrics read 0; indexing still works).
// This is NOT the Arc sentinel (which sets STABLE_TOKEN_POOL = REFERENCE_TOKEN to force a price of 1) —
// here WETH is a volatile reference, so we must read a real pool.
const WETH = '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73'.toLowerCase()
const USDG = '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168'.toLowerCase()
const WETH_USDG_POOL = '0x0000000000000000000000000000000000000000' // TODO: WETH/USDG v3 pool address once seeded

export const FACTORY_ADDRESS = '0x1f7d7550b1b028f7571e69a784071f0205fd2efa'

export const REFERENCE_TOKEN = WETH
export const STABLE_TOKEN_POOL = WETH_USDG_POOL

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('1')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// tokens whose amounts contribute to tracked volume and liquidity (common pairing tokens)
export const WHITELIST_TOKENS: string[] = [WETH, USDG]

export const STABLE_COINS: string[] = [USDG]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
