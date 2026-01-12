import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

const WETH = '0x4200000000000000000000000000000000000006'.toLowerCase()
const USDT0 = '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb'.toLowerCase()
const USDTm = '0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7'.toLowerCase()
const MEGA = '0x28B7E77f82B25B95953825F1E3eA0E36c1c29861'.toLowerCase()
const WETH_USDT0 = '0xd64b667aCa62c0614eBba4E1bc0005689E635984'.toLowerCase()
export const FACTORY_ADDRESS = '0x365de2d31084f7afafd53078eafbf598f29702e8'

export const REFERENCE_TOKEN = WETH
export const STABLE_TOKEN_POOL = WETH_USDT0

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('1')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [WETH, USDT0, USDTm, MEGA]

export const STABLE_COINS: string[] = [USDT0, USDTm]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
