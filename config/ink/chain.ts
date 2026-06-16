import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

const WETH = '0x4200000000000000000000000000000000000006'.toLowerCase()
const USDCE = '0xF1815bd50389c46847f0Bda824eC8da914045D14'.toLowerCase()
const USDT0 = '0x0200C29006150606B650577BBE7B6248F58470c1'.toLowerCase()
const WETH_USDCE_POOL = '0xd5aa1bd330a94332f071da5bb3651ec372ea6926'.toLowerCase()

export const FACTORY_ADDRESS = '0x640887a9ba3a9c53ed27d0f7e8246a4f933f3424'

export const REFERENCE_TOKEN = WETH
export const STABLE_TOKEN_POOL = WETH_USDCE_POOL

export const TVL_MULTIPLIER_THRESHOLD = '1'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('1')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [WETH, USDCE, USDT0]

export const STABLE_COINS: string[] = [USDCE, USDT0]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
