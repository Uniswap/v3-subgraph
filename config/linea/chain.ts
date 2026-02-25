import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

const WETH = '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f'.toLowerCase()
const USDC = '0x176211869cA2b568f2A7D4EE941E073a821EE1ff'.toLowerCase()
const MUSD = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA'.toLowerCase()
const USDT = '0xA219439258ca9da29E9Cc4cE5596924745e12B93'.toLowerCase()
const LINEA = '0x1789e0043623282d5dcc7f213d703c6d8bafbb04'.toLowerCase()
const WBTC = '0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4'.toLowerCase()
const REX33 = '0xe4eEB461Ad1e4ef8b8EF71a33694CCD84Af051C4'.toLowerCase()
const WSTETH = '0xB5beDd42000b71FddE22D3eE8a79Bd49A568fC8F'.toLowerCase()
const EZETH = '0x2416092f143378750bb29b79ed961ab195cceea5'.toLowerCase()
const WEETH = '0x1bf74c010e6320bab11e2e5a532b5ac15e0b8aa6'.toLowerCase()
const USDCE = '0x79a02482a880bce3f13e09da970dc34db4cd24d1'.toLowerCase()

export const FACTORY_ADDRESS = '0x31FAfd4889FA1269F7a13A66eE0fB458f27D72A9'

const USDC_WETH = '0x93F626d0E471279bd8d1420959CC881BdacfDAB1'.toLowerCase()

export const REFERENCE_TOKEN = WETH
export const STABLE_TOKEN_POOL = USDC_WETH

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('2')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [WETH, USDC, MUSD, USDT, LINEA, WBTC, REX33, WSTETH, EZETH, WEETH, USDCE]

export const STABLE_COINS: string[] = [USDC, MUSD, USDT, USDCE]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
