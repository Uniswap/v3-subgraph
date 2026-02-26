import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

const PATHUSD = '0x20C0000000000000000000000000000000000000'.toLowerCase()
const USDT0 = '0x20c00000000000000000000014f22ca97301eb73'.toLowerCase()
const USDCE = '0x20C000000000000000000000b9537d11c60E8b50'.toLowerCase()
const EURC = '0x20c0000000000000000000001621e21F71CF12fb'.toLowerCase()

const PATHUSD_USDC_POOL = '0x704214be4982ccec66c5d538f2721085414320ee'.toLowerCase()

export const FACTORY_ADDRESS = '0x24a3d4757e330890a8b8978028c9e58e04611fd6'

export const REFERENCE_TOKEN = PATHUSD
export const STABLE_TOKEN_POOL = PATHUSD_USDC_POOL

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('2000')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [PATHUSD, USDT0, USDCE, EURC]

export const STABLE_COINS: string[] = [PATHUSD, USDT0, USDCE]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
