import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

const WOKB = '0xe538905cf8410324e03A5A23C1c177a474D59b2b'.toLowerCase()
const WETH = '0x5A77f1443D16ee5761d310e38b62f77f726bC71c'.toLowerCase()
const USDT = '0x1E4a5963aBFD975d8c9021ce480b42188849D41d'.toLowerCase()
const USDT0 = '0x779Ded0c9e1022225f8E0630b35a9b54bE713736'.toLowerCase()
const USDC = '0x74b7F16337b8972027F6196A17a631aC6dE26d22'.toLowerCase()
const USDCe = '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035'.toLowerCase()
const WBTC = '0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1'.toLowerCase()
const DAI = ' 0xC5015b9d9161Dca7e18e32f6f25C4aD850731Fd4'.toLowerCase()
const xETH = '0xE7B000003A45145decf8a28FC755aD5eC5EA025A'.toLowerCase()
const xSOL = '0x505000008DE8748DBd4422ff4687a4FC9bEba15b'.toLowerCase()
const WOKB_USDC = '0x92Ae4136f5F141F9d20eAa0c3533f48c21Fa8580'.toLowerCase()

export const FACTORY_ADDRESS = '0x4b2ab38dbf28d31d467aa8993f6c2585981d6804'

export const REFERENCE_TOKEN = WOKB
export const STABLE_TOKEN_POOL = WOKB_USDC

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('25')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [WOKB, WETH, USDT, USDT0, USDC, USDCe, WBTC, DAI, xETH, xSOL]

export const STABLE_COINS: string[] = [USDC, USDT, DAI]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
