import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = Address.fromString('0xe0704DB90bcAA1eAFc00E958FF815Ab7aa11Ef47')

export const REFERENCE_TOKEN = '0x6bdc36e20d267ff0dd6097799f82e78907105e2f' // WGHO
export const STABLE_TOKEN_POOL = '0x5eb6b146d7a5322b763c8f8b0eb2fdd5d15e49de' // WGHO/USDC 0.01%

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '10000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('1')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [
  '0x6bdc36e20d267ff0dd6097799f82e78907105e2f', // WGHO
  '0xe5ecd226b3032910ceaa43ba92ee8232f8237553', // WETH
  '0x88f08e304ec4f90d644cec3fb69b8ad414acf884', // USDC
]

export const STABLE_COINS: string[] = [
  '0x88f08e304ec4f90d644cec3fb69b8ad414acf884', // USDC
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
