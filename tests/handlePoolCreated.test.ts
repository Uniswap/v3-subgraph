import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { assert, beforeEach, clearStore, createMockedFunction, test } from 'matchstick-as/assembly/index'
import { describe, test } from 'matchstick-as/assembly/index'

import { populateEmptyPools } from '../src/backfill'
import { NULL_ETH_HEX_STRING } from '../src/utils'
import { StaticTokenDefinition } from '../src/utils/staticTokenDefinition'
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol, fetchTokenTotalSupply } from '../src/utils/token'
import {
  assertObjectMatches,
  getPoolFixture,
  getTokenFixture,
  invokePoolCreatedWithMockedEthCalls,
  MOCK_EVENT,
  TEST_CONFIG,
  TEST_CONFIG_WITH_POOL_SKIPPED,
  USDC_MAINNET_FIXTURE,
  USDC_WETH_03_MAINNET_POOL_FIXTURE,
} from './constants'

describe('handlePoolCreated', () => {
  beforeEach(() => {
    clearStore()
  })

  test('success - create a pool', () => {
    const poolAddress = TEST_CONFIG.stablecoinWrappedNativePoolAddress
    const poolFixture = getPoolFixture(poolAddress)
    const token0Fixture = getTokenFixture(poolFixture.token0.address)
    const token1Fixture = getTokenFixture(poolFixture.token1.address)

    assert.notInStore('Factory', TEST_CONFIG.factoryAddress)
    assert.notInStore('Pool', poolAddress)

    assert.notInStore('Token', token0Fixture.address)
    assert.notInStore('Token', token1Fixture.address)

    invokePoolCreatedWithMockedEthCalls(MOCK_EVENT, TEST_CONFIG)

    assertObjectMatches('Token', token0Fixture.address, [['symbol', token0Fixture.symbol]])

    assertObjectMatches('Token', token1Fixture.address, [['symbol', token1Fixture.symbol]])

    assertObjectMatches('Pool', poolAddress, [
      ['token0', token0Fixture.address],
      ['token1', token1Fixture.address],
      ['feeTier', poolFixture.feeTier.toString()],
    ])
  })

  test('success - skip pool creation if address in poolToSkip', () => {
    const poolAddress = TEST_CONFIG_WITH_POOL_SKIPPED.stablecoinWrappedNativePoolAddress
    const poolFixture = getPoolFixture(poolAddress)
    const token0Fixture = getTokenFixture(poolFixture.token0.address)
    const token1Fixture = getTokenFixture(poolFixture.token1.address)

    invokePoolCreatedWithMockedEthCalls(MOCK_EVENT, TEST_CONFIG_WITH_POOL_SKIPPED)

    assert.notInStore('Factory', TEST_CONFIG.factoryAddress)
    assert.notInStore('Pool', poolAddress)

    assert.notInStore('Token', token0Fixture.address)
    assert.notInStore('Token', token1Fixture.address)
  })

  describe('populateEmptyPools', () => {
    test('success', () => {
      const poolAddress = Address.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.address)
      createMockedFunction(poolAddress, 'liquidity', 'liquidity():(uint128)').returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.liquidity)),
      ])
      createMockedFunction(poolAddress, 'fee', 'fee():(uint24)').returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.feeTier)),
      ])

      const token0Fixture = USDC_WETH_03_MAINNET_POOL_FIXTURE.token0
      const token0Address = Address.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.token0.address)
      createMockedFunction(token0Address, 'symbol', 'symbol():(string)').returns([
        ethereum.Value.fromString(token0Fixture.symbol),
      ])
      createMockedFunction(token0Address, 'name', 'name():(string)').returns([
        ethereum.Value.fromString(token0Fixture.name),
      ])
      createMockedFunction(token0Address, 'totalSupply', 'totalSupply():(uint256)').returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token0Fixture.totalSupply)),
      ])
      createMockedFunction(token0Address, 'decimals', 'decimals():(uint32)').returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token0Fixture.decimals)),
      ])
      createMockedFunction(token0Address, 'balanceOf', 'balanceOf(address):(uint256)')
        .withArgs([ethereum.Value.fromAddress(Address.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.address))])
        .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token0Fixture.balanceOf))])

      const token1Fixture = USDC_WETH_03_MAINNET_POOL_FIXTURE.token1
      const token1Address = Address.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.token1.address)
      createMockedFunction(token1Address, 'symbol', 'symbol():(string)').returns([
        ethereum.Value.fromString(token1Fixture.symbol),
      ])
      createMockedFunction(token1Address, 'name', 'name():(string)').returns([
        ethereum.Value.fromString(token1Fixture.name),
      ])
      createMockedFunction(token1Address, 'totalSupply', 'totalSupply():(uint256)').returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token1Fixture.totalSupply)),
      ])
      createMockedFunction(token1Address, 'decimals', 'decimals():(uint32)').returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token1Fixture.decimals)),
      ])
      createMockedFunction(token1Address, 'balanceOf', 'balanceOf(address):(uint256)')
        .withArgs([ethereum.Value.fromAddress(Address.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.address))])
        .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString(token1Fixture.balanceOf))])

      populateEmptyPools(
        [
          [
            Address.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.address), // first address is unused, hence reusing this pool address
            Address.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.address),
            Address.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.token0.address),
            Address.fromString(USDC_WETH_03_MAINNET_POOL_FIXTURE.token1.address),
          ],
        ],
        [],
      )

      assertObjectMatches('Token', token0Fixture.address, [['symbol', token0Fixture.symbol]])

      assertObjectMatches('Token', token1Fixture.address, [['symbol', token1Fixture.symbol]])

      assertObjectMatches('Pool', USDC_WETH_03_MAINNET_POOL_FIXTURE.address, [
        ['token0', token0Fixture.address],
        ['token1', token1Fixture.address],
        ['feeTier', USDC_WETH_03_MAINNET_POOL_FIXTURE.feeTier],
      ])
    })
  })

  describe('fetchTokenSymbol', () => {
    test('success - fetch token symbol', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'symbol', 'symbol():(string)').returns([ethereum.Value.fromString('USDC')])
      const symbol = fetchTokenSymbol(usdcAddress, [])
      assert.stringEquals(symbol, 'USDC')
    })

    test('success - fetch token symbol falls back to bytes call', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'symbol', 'symbol():(string)').reverts()
      createMockedFunction(usdcAddress, 'symbol', 'symbol():(bytes32)').returns([
        ethereum.Value.fromBytes(Bytes.fromUTF8('USDC')),
      ])
      const symbol = fetchTokenSymbol(usdcAddress, [])
      assert.stringEquals(symbol, 'USDC')
    })

    test('success - fetch token symbol falls back to static definition', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'symbol', 'symbol():(string)').reverts()
      createMockedFunction(usdcAddress, 'symbol', 'symbol():(bytes32)').returns([
        ethereum.Value.fromBytes(Bytes.fromHexString(NULL_ETH_HEX_STRING)),
      ])
      const staticDefinitions: Array<StaticTokenDefinition> = [
        {
          address: Address.fromString(USDC_MAINNET_FIXTURE.address),
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: BigInt.fromI32(6),
        },
      ]
      const symbol = fetchTokenSymbol(usdcAddress, staticDefinitions)
      assert.stringEquals(symbol, 'USDC')
    })

    test('failure - fetch token symbol reverts', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'symbol', 'symbol():(string)').reverts()
      createMockedFunction(usdcAddress, 'symbol', 'symbol():(bytes32)').reverts()
      const symbol = fetchTokenSymbol(usdcAddress, [])
      assert.stringEquals(symbol, 'unknown')
    })
  })

  describe('fetchTokenName', () => {
    test('success - fetch token name', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'name', 'name():(string)').returns([ethereum.Value.fromString('USD Coin')])
      const name = fetchTokenName(usdcAddress, [])
      assert.stringEquals(name, 'USD Coin')
    })

    test('success - fetch token name falls back to bytes call', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'name', 'name():(string)').reverts()
      createMockedFunction(usdcAddress, 'name', 'name():(bytes32)').returns([
        ethereum.Value.fromBytes(Bytes.fromUTF8('USD Coin')),
      ])
      const name = fetchTokenName(usdcAddress, [])
      assert.stringEquals(name, 'USD Coin')
    })

    test('success - fetch token name falls back to static definition', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'name', 'name():(string)').reverts()
      createMockedFunction(usdcAddress, 'name', 'name():(bytes32)').returns([
        ethereum.Value.fromBytes(Bytes.fromHexString(NULL_ETH_HEX_STRING)),
      ])
      const staticDefinitions: Array<StaticTokenDefinition> = [
        {
          address: Address.fromString(USDC_MAINNET_FIXTURE.address),
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: BigInt.fromI32(6),
        },
      ]
      const name = fetchTokenName(usdcAddress, staticDefinitions)
      assert.stringEquals(name, 'USD Coin')
    })

    test('failure - fetch token name reverts', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'name', 'name():(string)').reverts()
      createMockedFunction(usdcAddress, 'name', 'name():(bytes32)').reverts()
      const name = fetchTokenName(usdcAddress, [])
      assert.stringEquals(name, 'unknown')
    })
  })

  describe('fetchTokenTotalSupply', () => {
    test('success - fetch token total supply', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'totalSupply', 'totalSupply():(uint256)').returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString('300')),
      ])
      const totalSupply = fetchTokenTotalSupply(usdcAddress)
      assert.bigIntEquals(totalSupply, BigInt.fromString('300'))
    })

    test('failure - fetch token total supply reverts', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'totalSupply', 'totalSupply():(uint256)').reverts()
      const totalSupply = fetchTokenTotalSupply(usdcAddress)
      assert.bigIntEquals(totalSupply, BigInt.zero())
    })
  })

  describe('fetchTokenDecimals', () => {
    test('success - fetch token decimals', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'decimals', 'decimals():(uint32)').returns([
        ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(6)),
      ])
      const decimals = fetchTokenDecimals(usdcAddress, [])
      assert.assertTrue(decimals == BigInt.fromI32(6))
    })

    test('success - fetch token decimals falls back to static definition', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'decimals', 'decimals():(uint32)').reverts()
      const staticDefinitions: Array<StaticTokenDefinition> = [
        {
          address: Address.fromString(USDC_MAINNET_FIXTURE.address),
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: BigInt.fromI32(6),
        },
      ]
      const decimals = fetchTokenDecimals(usdcAddress, staticDefinitions)
      assert.assertTrue(decimals == BigInt.fromI32(6))
    })

    test('failure - fetch token decimals reverts', () => {
      const usdcAddress = Address.fromString(USDC_MAINNET_FIXTURE.address)
      createMockedFunction(usdcAddress, 'decimals', 'decimals():(uint32)').reverts()
      const decimals: BigInt | null = fetchTokenDecimals(usdcAddress, [])
      assert.assertTrue(decimals === null)
    })
  })
})
