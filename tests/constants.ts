import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { assert, createMockedFunction, newMockEvent } from 'matchstick-as'

import { handlePoolCreatedHelper } from '../src/mappings/factory'
import { PoolCreated } from '../src/types/Factory/Factory'
import { Pool, Token } from '../src/types/schema'
import { SubgraphConfig } from '../src/utils/chains'
import { ZERO_BD, ZERO_BI } from '../src/utils/constants'

const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
const USDC_MAINNET_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const WETH_MAINNET_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const WBTC_MAINNET_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
export const USDC_WETH_03_MAINNET_POOL = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8'
export const WBTC_WETH_03_MAINNET_POOL = '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed'
export const POOL_FEE_TIER_03 = 3000

export const TEST_CONFIG: SubgraphConfig = {
  factoryAddress: FACTORY_ADDRESS,
  stablecoinWrappedNativePoolAddress: USDC_WETH_03_MAINNET_POOL,
  stablecoinIsToken0: true,
  wrappedNativeAddress: WETH_MAINNET_ADDRESS,
  minimumNativeLocked: ZERO_BD,
  poolsToSkip: [],
  stablecoinAddresses: [USDC_MAINNET_ADDRESS],
  whitelistTokens: [WETH_MAINNET_ADDRESS, USDC_MAINNET_ADDRESS],
  tokenOverrides: [],
  poolsToSkip: [],
  poolMappings: [],
}

export const TEST_CONFIG_WITH_NO_WHITELIST: SubgraphConfig = {
  factoryAddress: FACTORY_ADDRESS,
  stablecoinWrappedNativePoolAddress: USDC_WETH_03_MAINNET_POOL,
  stablecoinIsToken0: true,
  wrappedNativeAddress: WETH_MAINNET_ADDRESS,
  minimumNativeLocked: ZERO_BD,
  poolsToSkip: [],
  stablecoinAddresses: [USDC_MAINNET_ADDRESS],
  whitelistTokens: [],
  tokenOverrides: [],
  poolsToSkip: [],
  poolMappings: [],
}

export const TEST_CONFIG_WITH_POOL_SKIPPED: SubgraphConfig = {
  factoryAddress: FACTORY_ADDRESS,
  stablecoinWrappedNativePoolAddress: USDC_WETH_03_MAINNET_POOL,
  stablecoinIsToken0: true,
  wrappedNativeAddress: WETH_MAINNET_ADDRESS,
  minimumNativeLocked: ZERO_BD,
  poolsToSkip: [],
  stablecoinAddresses: [USDC_MAINNET_ADDRESS],
  whitelistTokens: [WETH_MAINNET_ADDRESS, USDC_MAINNET_ADDRESS],
  tokenOverrides: [],
  poolsToSkip: [USDC_WETH_03_MAINNET_POOL],
  poolMappings: [],
}

export class TokenFixture {
  address: string
  symbol: string
  name: string
  totalSupply: string
  decimals: string
  balanceOf: string
}

export const USDC_MAINNET_FIXTURE: TokenFixture = {
  address: USDC_MAINNET_ADDRESS,
  symbol: 'USDC',
  name: 'USD Coin',
  totalSupply: '300',
  decimals: '6',
  balanceOf: '1000',
}

export const WETH_MAINNET_FIXTURE: TokenFixture = {
  address: WETH_MAINNET_ADDRESS,
  symbol: 'WETH',
  name: 'Wrapped Ether',
  totalSupply: '100',
  decimals: '18',
  balanceOf: '500',
}

export const WBTC_MAINNET_FIXTURE: TokenFixture = {
  address: WBTC_MAINNET_ADDRESS,
  symbol: 'WBTC',
  name: 'Wrapped Bitcoin',
  totalSupply: '200',
  decimals: '8',
  balanceOf: '750',
}

export const getTokenFixture = (tokenAddress: string): TokenFixture => {
  if (tokenAddress == USDC_MAINNET_FIXTURE.address) {
    return USDC_MAINNET_FIXTURE
  } else if (tokenAddress == WETH_MAINNET_FIXTURE.address) {
    return WETH_MAINNET_FIXTURE
  } else if (tokenAddress == WBTC_MAINNET_FIXTURE.address) {
    return WBTC_MAINNET_FIXTURE
  } else {
    throw new Error('Token address not found in fixtures')
  }
}

export class PoolFixture {
  address: string
  token0: TokenFixture
  token1: TokenFixture
  feeTier: string
  tickSpacing: string
  liquidity: string
}

export const USDC_WETH_03_MAINNET_POOL_FIXTURE: PoolFixture = {
  address: USDC_WETH_03_MAINNET_POOL,
  token0: USDC_MAINNET_FIXTURE,
  token1: WETH_MAINNET_FIXTURE,
  feeTier: '3000',
  tickSpacing: '60',
  liquidity: '100',
}

export const WBTC_WETH_03_MAINNET_POOL_FIXTURE: PoolFixture = {
  address: WBTC_WETH_03_MAINNET_POOL,
  token0: WBTC_MAINNET_FIXTURE,
  token1: WETH_MAINNET_FIXTURE,
  feeTier: '3000',
  tickSpacing: '60',
  liquidity: '200',
}

export const getPoolFixture = (poolAddress: string): PoolFixture => {
  if (poolAddress == USDC_WETH_03_MAINNET_POOL) {
    return USDC_WETH_03_MAINNET_POOL_FIXTURE
  } else if (poolAddress == WBTC_WETH_03_MAINNET_POOL) {
    return WBTC_WETH_03_MAINNET_POOL_FIXTURE
  } else {
    throw new Error('Pool address not found in fixtures')
  }
}

export const TEST_ETH_PRICE_USD = BigDecimal.fromString('2000')
export const TEST_USDC_DERIVED_ETH = BigDecimal.fromString('1').div(BigDecimal.fromString('2000'))
export const TEST_WETH_DERIVED_ETH = BigDecimal.fromString('1')

export const MOCK_EVENT = newMockEvent()

export const invokePoolCreatedWithMockedEthCalls = (
  mockEvent: ethereum.Event,
  subgraphConfig: SubgraphConfig,
): void => {
  const pool = getPoolFixture(subgraphConfig.stablecoinWrappedNativePoolAddress)
  const feeTier = pool.feeTier
  const tickSpacing = pool.tickSpacing
  const token0 = getTokenFixture(pool.token0.address)
  const token1 = getTokenFixture(pool.token1.address)

  const mockEvent = newMockEvent()
  const token0Address = Address.fromString(token0.address)
  const token1Address = Address.fromString(token1.address)
  const poolAddress = Address.fromString(subgraphConfig.stablecoinWrappedNativePoolAddress)
  const parameters = [
    new ethereum.EventParam('token0', ethereum.Value.fromAddress(token0Address)),
    new ethereum.EventParam('token1', ethereum.Value.fromAddress(token1Address)),
    new ethereum.EventParam('fee', ethereum.Value.fromI32(parseInt(feeTier) as i32)),
    new ethereum.EventParam('tickSpacing', ethereum.Value.fromI32(parseInt(tickSpacing) as i32)),
    new ethereum.EventParam('pool', ethereum.Value.fromAddress(poolAddress)),
  ]
  const poolCreatedEvent = new PoolCreated(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    parameters,
    mockEvent.receipt,
  )
  // create mock contract calls for token0
  createMockedFunction(token0Address, 'symbol', 'symbol():(string)').returns([ethereum.Value.fromString(token0.symbol)])
  createMockedFunction(token0Address, 'name', 'name():(string)').returns([ethereum.Value.fromString(token0.name)])
  createMockedFunction(token0Address, 'totalSupply', 'totalSupply():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token0.totalSupply)),
  ])
  createMockedFunction(token0Address, 'decimals', 'decimals():(uint32)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token0.decimals)),
  ])
  // create mock contract calls for token1
  createMockedFunction(token1Address, 'symbol', 'symbol():(string)').returns([ethereum.Value.fromString(token1.symbol)])
  createMockedFunction(token1Address, 'name', 'name():(string)').returns([ethereum.Value.fromString(token1.name)])
  createMockedFunction(token1Address, 'totalSupply', 'totalSupply():(uint256)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token1.totalSupply)),
  ])
  createMockedFunction(token1Address, 'decimals', 'decimals():(uint32)').returns([
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token1.decimals)),
  ])
  handlePoolCreatedHelper(poolCreatedEvent, subgraphConfig)
}

// More lightweight than the method above which invokes handlePoolCreated. This
// method only creates the pool entity while the above method also creates the
// relevant token and factory entities.
export const createAndStoreTestPool = (poolFixture: PoolFixture): Pool => {
  const poolAddress = poolFixture.address
  const token0Address = poolFixture.token0.address
  const token1Address = poolFixture.token1.address
  const feeTier = parseInt(poolFixture.feeTier) as i32

  const pool = new Pool(poolAddress)
  pool.createdAtTimestamp = ZERO_BI
  pool.createdAtBlockNumber = ZERO_BI
  pool.token0 = token0Address
  pool.token1 = token1Address
  pool.feeTier = BigInt.fromI32(feeTier)
  pool.liquidity = ZERO_BI
  pool.sqrtPrice = ZERO_BI
  pool.token0Price = ZERO_BD
  pool.token1Price = ZERO_BD
  pool.tick = ZERO_BI
  pool.observationIndex = ZERO_BI
  pool.volumeToken0 = ZERO_BD
  pool.volumeToken1 = ZERO_BD
  pool.volumeUSD = ZERO_BD
  pool.untrackedVolumeUSD = ZERO_BD
  pool.feesUSD = ZERO_BD
  pool.txCount = ZERO_BI
  pool.collectedFeesToken0 = ZERO_BD
  pool.collectedFeesToken1 = ZERO_BD
  pool.collectedFeesUSD = ZERO_BD
  pool.totalValueLockedToken0 = ZERO_BD
  pool.totalValueLockedToken1 = ZERO_BD
  pool.totalValueLockedUSD = ZERO_BD
  pool.totalValueLockedETH = ZERO_BD
  pool.totalValueLockedUSDUntracked = ZERO_BD
  pool.liquidityProviderCount = ZERO_BI

  pool.save()
  return pool
}

export const createAndStoreTestToken = (tokenFixture: TokenFixture): Token => {
  const token = new Token(tokenFixture.address)
  token.symbol = tokenFixture.symbol
  token.name = tokenFixture.name
  token.decimals = BigInt.fromString(tokenFixture.decimals)
  token.totalSupply = BigInt.fromString(tokenFixture.totalSupply)
  token.volume = ZERO_BD
  token.volumeUSD = ZERO_BD
  token.untrackedVolumeUSD = ZERO_BD
  token.feesUSD = ZERO_BD
  token.txCount = ZERO_BI
  token.poolCount = ZERO_BI
  token.totalValueLocked = ZERO_BD
  token.totalValueLockedUSD = ZERO_BD
  token.totalValueLockedUSDUntracked = ZERO_BD
  token.derivedETH = ZERO_BD
  token.whitelistPools = []

  token.save()
  return token
}

// Typescript for Subgraphs do not support Record types so we use a 2D string array to represent the object instead.
export const assertObjectMatches = (entityType: string, id: string, obj: string[][]): void => {
  for (let i = 0; i < obj.length; i++) {
    assert.fieldEquals(entityType, id, obj[i][0], obj[i][1])
  }
}
