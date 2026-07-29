import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

// Arc (chainId 5042) is Circle's USDC-native L1: the native gas token is USDC, exposed as an
// ERC-20 at the system address below (6 decimals). There is NO wrapped native — the "WETH9"
// slot in the Uniswap deployment (0x8bceaa40…) is the UnsupportedProtocol revert stub — so
// pools pair directly against native USDC, and USDC is the reference token.
const USDC = '0x3600000000000000000000000000000000000000'.toLowerCase()
const EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a'.toLowerCase()
const USYC = '0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C'.toLowerCase()
const CIRBTC = '0x171A4217b86A807A64eB94757Db6849fb4bDbAA0'.toLowerCase() // cirBTC (BTC-pegged) — whitelist only, not a USD stable
const WETH = '0x128cC466B61f542da60c70e3aA11c10e19B84EDB'.toLowerCase() // bridged ETH — whitelist only (not the native/reference; Arc's native is USDC)

export const FACTORY_ADDRESS = '0xf0db7b58379503491d857db50ac9ece64c653918'

// Reference token is USDC itself (the dollar). Setting STABLE_TOKEN_POOL = REFERENCE_TOKEN
// signals getEthPriceInUSD() to use a USD price of 1 (no wrapped-native/stable pool exists).
export const REFERENCE_TOKEN = USDC
export const STABLE_TOKEN_POOL = REFERENCE_TOKEN

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('2000')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// tokens whose amounts contribute to tracked volume and liquidity (common pairing tokens)
export const WHITELIST_TOKENS: string[] = [USDC, EURC, USYC, CIRBTC, WETH]

// USD-pegged stablecoins only: EURC is EUR-pegged (~$1.08) and USYC is yield-bearing, so both
// are whitelisted for pricing but excluded from STABLE_COINS (which are treated as exactly $1).
export const STABLE_COINS: string[] = [USDC]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
