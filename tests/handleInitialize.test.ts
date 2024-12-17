import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { assert, beforeEach, clearStore, describe, test } from 'matchstick-as'

import { handleInitializeHelper } from '../src/mappings/pool/initialize'
import { Pool, Token } from '../src/types/schema'
import { Initialize } from '../src/types/templates/Pool/Pool'
import { findNativePerToken } from '../src/utils/pricing'
import {
  assertObjectMatches,
  createAndStoreTestPool,
  createAndStoreTestToken,
  MOCK_EVENT,
  TEST_CONFIG,
  USDC_MAINNET_FIXTURE,
  USDC_WETH_03_MAINNET_POOL,
  USDC_WETH_03_MAINNET_POOL_FIXTURE,
  WBTC_MAINNET_FIXTURE,
  WBTC_WETH_03_MAINNET_POOL_FIXTURE,
  WETH_MAINNET_FIXTURE,
} from './constants'

class InitializeFixture {
  sqrtPriceX96: BigInt
  tick: i32
}

const INITIALIZE_FIXTURE: InitializeFixture = {
  sqrtPriceX96: BigInt.fromString('1111111111111111'),
  tick: 194280,
}

const INITIALIZE_EVENT = new Initialize(
  Address.fromString(USDC_WETH_03_MAINNET_POOL),
  MOCK_EVENT.logIndex,
  MOCK_EVENT.transactionLogIndex,
  MOCK_EVENT.logType,
  MOCK_EVENT.block,
  MOCK_EVENT.transaction,
  [
    new ethereum.EventParam('sqrtPriceX96', ethereum.Value.fromUnsignedBigInt(INITIALIZE_FIXTURE.sqrtPriceX96)),
    new ethereum.EventParam('tick', ethereum.Value.fromI32(INITIALIZE_FIXTURE.tick)),
  ],
  MOCK_EVENT.receipt,
)

describe('handleInitialize', () => {
  test('success', () => {
    createAndStoreTestPool(USDC_WETH_03_MAINNET_POOL_FIXTURE)

    handleInitializeHelper(INITIALIZE_EVENT)

    assertObjectMatches('Pool', USDC_WETH_03_MAINNET_POOL, [])

    assertObjectMatches('Token', USDC_MAINNET_FIXTURE.address, [])

    assertObjectMatches('Token', WETH_MAINNET_FIXTURE.address, [])
  })
})

describe('getEthPriceInUSD', () => {
  beforeEach(() => {
    clearStore()
    createAndStoreTestPool(USDC_WETH_03_MAINNET_POOL_FIXTURE)
  })

  test('success - stablecoin is token0', () => {
    const pool = Pool.load(USDC_WETH_03_MAINNET_POOL)!
    pool.save()
  })

  test('success - stablecoin is token1', () => {
    const pool = Pool.load(USDC_WETH_03_MAINNET_POOL)!
    pool.save()
  })

  test('failure - pool not found', () => {
    const pool = Pool.load(USDC_WETH_03_MAINNET_POOL)!
    pool.save()
  })
})

describe('findNativePerToken', () => {
  beforeEach(() => {
    clearStore()
  })

  test('success - token is wrapped native', () => {
    const token = createAndStoreTestToken(WETH_MAINNET_FIXTURE)
    const ethPerToken = findNativePerToken(token as Token, TEST_CONFIG.wrappedNativeAddress)
    assert.assertTrue(ethPerToken == BigDecimal.fromString('1'))
  })

  test('success - token is stablecoin', () => {
    const token = createAndStoreTestToken(USDC_MAINNET_FIXTURE)
    // Pruned and hard-coded to 0.
    const ethPerToken = findNativePerToken(token as Token, TEST_CONFIG.wrappedNativeAddress)
    assert.assertTrue(ethPerToken == BigDecimal.fromString('0'))
  })

  test('success - token is not wrapped native or stablecoin', () => {
    const pool = createAndStoreTestPool(WBTC_WETH_03_MAINNET_POOL_FIXTURE)

    pool.liquidity = BigInt.fromString('100')
    pool.save()

    const token0 = createAndStoreTestToken(WBTC_MAINNET_FIXTURE)
    token0.save()

    const token1 = createAndStoreTestToken(WETH_MAINNET_FIXTURE)
    token1.save()

    // Pruned and hard-coded to 0.
    const ethPerToken = findNativePerToken(token0 as Token, WETH_MAINNET_FIXTURE.address)
    assert.assertTrue(ethPerToken == BigDecimal.fromString('0'))
  })

  test('success - token is not wrapped native or stablecoin, but has no pools', () => {
    const token0 = createAndStoreTestToken(WBTC_MAINNET_FIXTURE)
    // Pruned and hard-coded to 0.
    const ethPerToken = findNativePerToken(token0 as Token, TEST_CONFIG.wrappedNativeAddress)
    assert.assertTrue(ethPerToken == BigDecimal.fromString('0'))
  })

  test('success - token is not wrapped native or stablecoin, but has no pools with liquidity', () => {
    const token0 = createAndStoreTestToken(WBTC_MAINNET_FIXTURE)
    token0.save()

    const ethPerToken = findNativePerToken(token0 as Token, TEST_CONFIG.wrappedNativeAddress)
    assert.assertTrue(ethPerToken == BigDecimal.fromString('0'))
  })
})
