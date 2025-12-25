import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

export const REFERENCE_TOKEN = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
export const STABLE_TOKEN_POOL = '0x17c14d2c404d167802b16c450d3c99f88f2c4f4d'

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('20')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// AAVE Arbitrum tokens - only pools with BOTH tokens in this list will be tracked
export const AAVE_ARBITRUM_TOKENS: string[] = [
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // ETH (WETH)
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC
  '0x35751007a407ca6feffe80b3cb397736d2cf4dbe', // weETH
  '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f', // WBTC
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT
  '0xf97f4df75117a78c1a5a0dbb814af92458539fb4', // LINK
  '0x912ce59144191c1204e64559fe8253a0e49e6548', // ARB
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
  '0xba5ddd1f9d7f570dc94a51479a000e3bce967196', // AAVE
  '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0', // UNI
  '0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34', // USDe
]

// token where amounts should contribute to tracked volume and liquidity
// updated to include all AAVE tokens for accurate price derivation
export const WHITELIST_TOKENS: string[] = [
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // WETH
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831', // USDC
  '0x35751007a407ca6feffe80b3cb397736d2cf4dbe', // weETH
  '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f', // WBTC
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT
  '0xf97f4df75117a78c1a5a0dbb814af92458539fb4', // LINK
  '0x912ce59144191c1204e64559fe8253a0e49e6548', // ARB
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
  '0xba5ddd1f9d7f570dc94a51479a000e3bce967196', // AAVE
  '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0', // UNI
  '0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34', // USDe
]

export const STABLE_COINS: string[] = [
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // USDC
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT
]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString(REFERENCE_TOKEN),
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xff970a61a04b1ca14834a43f5de4533ebddb5cc8'),
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: BigInt.fromI32(6),
  },
]
