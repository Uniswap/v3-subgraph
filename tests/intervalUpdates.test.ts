import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { beforeEach, clearStore, describe, test } from 'matchstick-as'

import { Bundle, Factory, Pool, Token } from '../src/types/schema'
import { ADDRESS_ZERO, ZERO_BD, ZERO_BI } from '../src/utils/constants'
import {
  updatePoolDayData,
  updatePoolHourData,
  updateTokenDayData,
  updateTokenHourData,
  updateUniswapDayData,
} from '../src/utils/intervalUpdates'
import {
  assertObjectMatches,
  createAndStoreTestPool,
  createAndStoreTestToken,
  MOCK_EVENT,
  MOCK_EVENT as poolEvent,
  TEST_CONFIG,
  TEST_ETH_PRICE_USD,
  USDC_WETH_03_MAINNET_POOL,
  USDC_WETH_03_MAINNET_POOL_FIXTURE,
  WETH_MAINNET_FIXTURE,
} from './constants'

describe('uniswap interval data', () => {
  beforeEach(() => {
    clearStore()

    const factory = new Factory(TEST_CONFIG.factoryAddress)
    factory.poolCount = ZERO_BI
    factory.totalVolumeUSD = ZERO_BD
    factory.totalVolumeETH = ZERO_BD
    factory.totalFeesUSD = ZERO_BD
    factory.totalFeesETH = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalValueLockedUSDUntracked = ZERO_BD
    factory.totalValueLockedETHUntracked = ZERO_BD
    factory.totalValueLockedETH = ZERO_BD
    factory.txCount = ZERO_BI
    factory.totalValueLockedUSD = ZERO_BD
    factory.owner = ADDRESS_ZERO

    factory.save()
  })

  test('success - create and update uniswapDayData', () => {
    // these are the only two fields that get persisted to uniswapDayData, set them to non-zero values
    const factory = Factory.load(TEST_CONFIG.factoryAddress)!
    const uniswapTxCount = BigInt.fromString('10')
    const uniswapTotalValueLockedUSD = BigDecimal.fromString('100')
    factory.txCount = uniswapTxCount
    factory.totalValueLockedUSD = uniswapTotalValueLockedUSD
    factory.save()

    updateUniswapDayData(poolEvent, TEST_CONFIG.factoryAddress)
    const dayId = poolEvent.block.timestamp.toI32() / 86400
    const dayStartTimestamp = dayId * 86400

    assertObjectMatches('UniswapDayData', dayId.toString(), [
      ['date', dayStartTimestamp.toString()],
      ['volumeETH', '0'],
      ['volumeUSD', '0'],
      ['volumeUSDUntracked', '0'],
      ['feesUSD', '0'],
      ['tvlUSD', uniswapTotalValueLockedUSD.toString()],
      ['txCount', uniswapTxCount.toString()],
    ])

    const updatedTxCount = BigInt.fromString('20')
    factory.txCount = updatedTxCount
    factory.save()

    updateUniswapDayData(poolEvent, TEST_CONFIG.factoryAddress)

    assertObjectMatches('UniswapDayData', dayId.toString(), [['txCount', updatedTxCount.toString()]])
  })
})

describe('pool interval data', () => {
  beforeEach(() => {
    clearStore()
    createAndStoreTestPool(USDC_WETH_03_MAINNET_POOL_FIXTURE)
  })

  test('success - create and update poolDayData', () => {
    const pool = Pool.load(USDC_WETH_03_MAINNET_POOL)!
    pool.token0Price = BigDecimal.fromString('1')
    pool.token1Price = BigDecimal.fromString('2')
    pool.liquidity = BigInt.fromString('100')
    pool.sqrtPrice = BigInt.fromString('200')
    pool.tick = BigInt.fromString('300')
    pool.totalValueLockedUSD = BigDecimal.fromString('1000')
    pool.save()

    const poolEvent = MOCK_EVENT
    poolEvent.address = Address.fromString(USDC_WETH_03_MAINNET_POOL)

    updatePoolDayData(poolEvent)

    const dayId = poolEvent.block.timestamp.toI32() / 86400
    const dayStartTimestamp = dayId * 86400
    const dayPoolID = poolEvent.address.toHexString().concat('-').concat(dayId.toString())

    assertObjectMatches('PoolDayData', dayPoolID, [
      ['date', dayStartTimestamp.toString()],
      ['pool', USDC_WETH_03_MAINNET_POOL],
      ['volumeToken0', '0'],
      ['volumeToken1', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['txCount', '1'],
      ['open', '1'],
      ['high', '1'],
      ['low', '1'],
      ['close', '1'],
      ['token0Price', '1'],
      ['token1Price', '2'],
      ['liquidity', '100'],
      ['sqrtPrice', '200'],
      ['tick', '300'],
      ['tvlUSD', '1000'],
    ])

    // update the high price
    pool.token0Price = BigDecimal.fromString('2')
    pool.save()

    updatePoolDayData(poolEvent)

    assertObjectMatches('PoolDayData', dayPoolID, [
      ['date', dayStartTimestamp.toString()],
      ['pool', USDC_WETH_03_MAINNET_POOL],
      ['volumeToken0', '0'],
      ['volumeToken1', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['txCount', '2'],
      ['open', '1'],
      ['high', '2'],
      ['low', '1'],
      ['close', '2'],
      ['token0Price', '2'],
      ['token1Price', '2'],
      ['liquidity', '100'],
      ['sqrtPrice', '200'],
      ['tick', '300'],
      ['tvlUSD', '1000'],
    ])

    // update the low price
    pool.token0Price = BigDecimal.fromString('0')
    pool.save()

    updatePoolDayData(poolEvent)

    assertObjectMatches('PoolDayData', dayPoolID, [
      ['date', dayStartTimestamp.toString()],
      ['pool', USDC_WETH_03_MAINNET_POOL],
      ['volumeToken0', '0'],
      ['volumeToken1', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['txCount', '3'],
      ['open', '1'],
      ['high', '2'],
      ['low', '0'],
      ['close', '0'],
      ['token0Price', '0'],
      ['token1Price', '2'],
      ['liquidity', '100'],
      ['sqrtPrice', '200'],
      ['tick', '300'],
      ['tvlUSD', '1000'],
    ])
  })

  test('success - create and update poolHourData', () => {
    const pool = Pool.load(USDC_WETH_03_MAINNET_POOL)!
    pool.token0Price = BigDecimal.fromString('1')
    pool.token1Price = BigDecimal.fromString('2')
    pool.liquidity = BigInt.fromString('100')
    pool.sqrtPrice = BigInt.fromString('200')
    pool.tick = BigInt.fromString('300')
    pool.totalValueLockedUSD = BigDecimal.fromString('1000')
    pool.save()

    const poolEvent = MOCK_EVENT
    poolEvent.address = Address.fromString(USDC_WETH_03_MAINNET_POOL)

    updatePoolHourData(poolEvent)

    const hourIndex = poolEvent.block.timestamp.toI32() / 3600
    const hourStartUnix = hourIndex * 3600
    const hourPoolID = poolEvent.address.toHexString().concat('-').concat(hourIndex.toString())

    assertObjectMatches('PoolHourData', hourPoolID, [
      ['periodStartUnix', hourStartUnix.toString()],
      ['pool', USDC_WETH_03_MAINNET_POOL],
      ['volumeToken0', '0'],
      ['volumeToken1', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['txCount', '1'],
      ['open', '1'],
      ['high', '1'],
      ['low', '1'],
      ['close', '1'],
      ['token0Price', '1'],
      ['token1Price', '2'],
      ['liquidity', '100'],
      ['sqrtPrice', '200'],
      ['tick', '300'],
      ['tvlUSD', '1000'],
    ])

    // update the high price
    pool.token0Price = BigDecimal.fromString('2')
    pool.save()

    updatePoolHourData(poolEvent)

    assertObjectMatches('PoolHourData', hourPoolID, [
      ['periodStartUnix', hourStartUnix.toString()],
      ['pool', USDC_WETH_03_MAINNET_POOL],
      ['volumeToken0', '0'],
      ['volumeToken1', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['txCount', '2'],
      ['open', '1'],
      ['high', '2'],
      ['low', '1'],
      ['close', '2'],
      ['token0Price', '2'],
      ['token1Price', '2'],
      ['liquidity', '100'],
      ['sqrtPrice', '200'],
      ['tick', '300'],
      ['tvlUSD', '1000'],
    ])

    // update the low price
    pool.token0Price = BigDecimal.fromString('0')
    pool.save()

    updatePoolHourData(poolEvent)

    assertObjectMatches('PoolHourData', hourPoolID, [
      ['periodStartUnix', hourStartUnix.toString()],
      ['pool', USDC_WETH_03_MAINNET_POOL],
      ['volumeToken0', '0'],
      ['volumeToken1', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['txCount', '3'],
      ['open', '1'],
      ['high', '2'],
      ['low', '0'],
      ['close', '0'],
      ['token0Price', '0'],
      ['token1Price', '2'],
      ['liquidity', '100'],
      ['sqrtPrice', '200'],
      ['tick', '300'],
      ['tvlUSD', '1000'],
    ])
  })
})

describe('token interval data', () => {
  beforeEach(() => {
    clearStore()

    createAndStoreTestToken(WETH_MAINNET_FIXTURE)

    const bundle = new Bundle('1')
    bundle.ethPriceUSD = ZERO_BD
    bundle.save()
  })

  test('success - create and update tokenDayData', () => {
    const token = Token.load(WETH_MAINNET_FIXTURE.address)!
    token.derivedETH = BigDecimal.fromString('1')
    token.totalValueLocked = BigDecimal.fromString('100')
    token.totalValueLockedUSD = BigDecimal.fromString('1000')
    token.save()

    const bundle = Bundle.load('1')!
    bundle.ethPriceUSD = TEST_ETH_PRICE_USD
    bundle.save()

    updateTokenDayData(token, MOCK_EVENT)

    const dayId = MOCK_EVENT.block.timestamp.toI32() / 86400
    const dayStartTimestamp = dayId * 86400
    const tokenDayID = token.id.toString().concat('-').concat(dayId.toString())

    assertObjectMatches('TokenDayData', tokenDayID, [
      ['date', dayStartTimestamp.toString()],
      ['token', WETH_MAINNET_FIXTURE.address],
      ['volume', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['untrackedVolumeUSD', '0'],
      ['open', TEST_ETH_PRICE_USD.toString()],
      ['high', TEST_ETH_PRICE_USD.toString()],
      ['low', TEST_ETH_PRICE_USD.toString()],
      ['close', TEST_ETH_PRICE_USD.toString()],
      ['priceUSD', TEST_ETH_PRICE_USD.toString()],
      ['totalValueLocked', '100'],
      ['totalValueLockedUSD', '1000'],
    ])

    // update the high price
    token.derivedETH = BigDecimal.fromString('2')
    token.save()

    const highPriceStr = TEST_ETH_PRICE_USD.times(BigDecimal.fromString('2')).toString()

    updateTokenDayData(token, MOCK_EVENT)

    assertObjectMatches('TokenDayData', tokenDayID, [
      ['date', dayStartTimestamp.toString()],
      ['token', WETH_MAINNET_FIXTURE.address],
      ['volume', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['untrackedVolumeUSD', '0'],
      ['open', TEST_ETH_PRICE_USD.toString()],
      ['high', highPriceStr],
      ['low', TEST_ETH_PRICE_USD.toString()],
      ['close', highPriceStr],
      ['priceUSD', highPriceStr],
      ['totalValueLocked', '100'],
      ['totalValueLockedUSD', '1000'],
    ])

    // update the low price
    token.derivedETH = ZERO_BD
    token.save()
    const lowPriceStr = ZERO_BD.toString()

    updateTokenDayData(token, MOCK_EVENT)

    assertObjectMatches('TokenDayData', tokenDayID, [
      ['date', dayStartTimestamp.toString()],
      ['token', WETH_MAINNET_FIXTURE.address],
      ['volume', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['untrackedVolumeUSD', '0'],
      ['open', TEST_ETH_PRICE_USD.toString()],
      ['high', highPriceStr],
      ['low', lowPriceStr],
      ['close', lowPriceStr],
      ['priceUSD', lowPriceStr],
      ['totalValueLocked', '100'],
      ['totalValueLockedUSD', '1000'],
    ])
  })

  test('success - create and update tokenHourData', () => {
    const token = Token.load(WETH_MAINNET_FIXTURE.address)!
    token.derivedETH = BigDecimal.fromString('1')
    token.totalValueLocked = BigDecimal.fromString('100')
    token.totalValueLockedUSD = BigDecimal.fromString('1000')
    token.save()

    const bundle = Bundle.load('1')!
    bundle.ethPriceUSD = TEST_ETH_PRICE_USD
    bundle.save()

    updateTokenHourData(token, MOCK_EVENT)

    const hourIndex = MOCK_EVENT.block.timestamp.toI32() / 3600
    const hourStartUnix = hourIndex * 3600
    const tokenHourID = token.id.toString().concat('-').concat(hourIndex.toString())

    assertObjectMatches('TokenHourData', tokenHourID, [
      ['periodStartUnix', hourStartUnix.toString()],
      ['token', WETH_MAINNET_FIXTURE.address],
      ['volume', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['untrackedVolumeUSD', '0'],
      ['open', TEST_ETH_PRICE_USD.toString()],
      ['high', TEST_ETH_PRICE_USD.toString()],
      ['low', TEST_ETH_PRICE_USD.toString()],
      ['close', TEST_ETH_PRICE_USD.toString()],
      ['priceUSD', TEST_ETH_PRICE_USD.toString()],
      ['totalValueLocked', '100'],
      ['totalValueLockedUSD', '1000'],
    ])

    // update the high price
    token.derivedETH = BigDecimal.fromString('2')
    token.save()

    const highPriceStr = TEST_ETH_PRICE_USD.times(BigDecimal.fromString('2')).toString()

    updateTokenHourData(token, MOCK_EVENT)

    assertObjectMatches('TokenHourData', tokenHourID, [
      ['periodStartUnix', hourStartUnix.toString()],
      ['token', WETH_MAINNET_FIXTURE.address],
      ['volume', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['untrackedVolumeUSD', '0'],
      ['open', TEST_ETH_PRICE_USD.toString()],
      ['high', highPriceStr],
      ['low', TEST_ETH_PRICE_USD.toString()],
      ['close', highPriceStr],
      ['priceUSD', highPriceStr],
      ['totalValueLocked', '100'],
      ['totalValueLockedUSD', '1000'],
    ])

    // update the low price
    token.derivedETH = ZERO_BD
    token.save()
    const lowPriceStr = ZERO_BD.toString()

    updateTokenHourData(token, MOCK_EVENT)

    assertObjectMatches('TokenHourData', tokenHourID, [
      ['periodStartUnix', hourStartUnix.toString()],
      ['token', WETH_MAINNET_FIXTURE.address],
      ['volume', '0'],
      ['volumeUSD', '0'],
      ['feesUSD', '0'],
      ['untrackedVolumeUSD', '0'],
      ['open', TEST_ETH_PRICE_USD.toString()],
      ['high', highPriceStr],
      ['low', lowPriceStr],
      ['close', lowPriceStr],
      ['priceUSD', lowPriceStr],
      ['totalValueLocked', '100'],
      ['totalValueLockedUSD', '1000'],
    ])
  })
})
