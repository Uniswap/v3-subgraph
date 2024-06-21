import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { beforeAll, describe, test } from 'matchstick-as'

import { handleCollectHelper } from '../src/mappings/pool/collect'
import { Bundle, Token } from '../src/types/schema'
import { Collect } from '../src/types/templates/Pool/Pool'
import { convertTokenToDecimal } from '../src/utils'
import { ZERO_BD } from '../src/utils/constants'
import {
  assertObjectMatches,
  invokePoolCreatedWithMockedEthCalls,
  MOCK_EVENT,
  TEST_CONFIG,
  TEST_CONFIG_WITH_NO_WHITELIST,
  TEST_ETH_PRICE_USD,
  TEST_USDC_DERIVED_ETH,
  TEST_WETH_DERIVED_ETH,
  USDC_MAINNET_FIXTURE,
  USDC_WETH_03_MAINNET_POOL,
  WETH_MAINNET_FIXTURE,
} from './constants'

class CollectFixture {
  owner: Address
  recipient: Address
  tickLower: i32
  tickUpper: i32
  amount0: BigInt
  amount1: BigInt
}

// https://etherscan.io/tx/0x328c84a513e6146dd3cf28861e8f2445e38d251c4b8a922057c755e12281c7ea
const COLLECT_FIXTURE: CollectFixture = {
  owner: Address.fromString('0xc36442b4a4522e871399cd717abdd847ab11fe88'),
  recipient: Address.fromString('0xc36442b4a4522e871399cd717abdd847ab11fe88'),
  tickLower: 81600,
  tickUpper: 84120,
  amount0: BigInt.fromString('0'),
  amount1: BigInt.fromString('19275229182128904'),
}

const COLLECT_EVENT = new Collect(
  Address.fromString(USDC_WETH_03_MAINNET_POOL),
  MOCK_EVENT.logIndex,
  MOCK_EVENT.transactionLogIndex,
  MOCK_EVENT.logType,
  MOCK_EVENT.block,
  MOCK_EVENT.transaction,
  [
    new ethereum.EventParam('owner', ethereum.Value.fromAddress(COLLECT_FIXTURE.owner)),
    new ethereum.EventParam('recipient', ethereum.Value.fromAddress(COLLECT_FIXTURE.recipient)),
    new ethereum.EventParam('tickLower', ethereum.Value.fromI32(COLLECT_FIXTURE.tickLower)),
    new ethereum.EventParam('tickUpper', ethereum.Value.fromI32(COLLECT_FIXTURE.tickUpper)),
    new ethereum.EventParam('amount0', ethereum.Value.fromUnsignedBigInt(COLLECT_FIXTURE.amount0)),
    new ethereum.EventParam('amount1', ethereum.Value.fromUnsignedBigInt(COLLECT_FIXTURE.amount1)),
  ],
  MOCK_EVENT.receipt,
)

describe('handleMint', () => {
  beforeAll(() => {
    invokePoolCreatedWithMockedEthCalls(MOCK_EVENT, TEST_CONFIG)

    const bundle = new Bundle('1')
    bundle.ethPriceUSD = TEST_ETH_PRICE_USD
    bundle.save()

    const usdcEntity = Token.load(USDC_MAINNET_FIXTURE.address)!
    usdcEntity.derivedETH = TEST_USDC_DERIVED_ETH
    usdcEntity.save()

    const wethEntity = Token.load(WETH_MAINNET_FIXTURE.address)!
    wethEntity.derivedETH = TEST_WETH_DERIVED_ETH
    wethEntity.save()
  })

  test('success - collect event', () => {
    // pass in empty whitelist to simplify this test. Doing so ignores the
    // effect of getTrackedAmountUSD which we test separately.
    const trackedCollectedAmountUSD = ZERO_BD
    handleCollectHelper(COLLECT_EVENT, TEST_CONFIG_WITH_NO_WHITELIST)

    const collectedAmountToken0 = convertTokenToDecimal(
      COLLECT_FIXTURE.amount0,
      BigInt.fromString(USDC_MAINNET_FIXTURE.decimals),
    )
    const collectedAmountToken1 = convertTokenToDecimal(
      COLLECT_FIXTURE.amount1,
      BigInt.fromString(WETH_MAINNET_FIXTURE.decimals),
    )
    const collectedAmountETH = collectedAmountToken0
      .times(TEST_USDC_DERIVED_ETH)
      .plus(collectedAmountToken1.times(TEST_WETH_DERIVED_ETH))
    const collectedAmountUSD = collectedAmountETH.times(TEST_ETH_PRICE_USD)

    assertObjectMatches('Factory', TEST_CONFIG.factoryAddress, [
      ['txCount', '1'],
      ['totalValueLockedETH', collectedAmountETH.neg().toString()],
      ['totalValueLockedUSD', collectedAmountUSD.neg().toString()],
    ])

    assertObjectMatches('Pool', USDC_WETH_03_MAINNET_POOL, [
      ['txCount', '1'],
      ['totalValueLockedToken0', collectedAmountToken0.neg().toString()],
      ['totalValueLockedToken1', collectedAmountToken1.neg().toString()],
      ['totalValueLockedETH', collectedAmountETH.neg().toString()],
      ['totalValueLockedUSD', collectedAmountUSD.neg().toString()],
      ['collectedFeesToken0', collectedAmountToken0.toString()],
      ['collectedFeesToken1', collectedAmountToken1.toString()],
      ['collectedFeesUSD', trackedCollectedAmountUSD.toString()],
    ])

    assertObjectMatches('Token', USDC_MAINNET_FIXTURE.address, [
      ['txCount', '1'],
      ['totalValueLocked', collectedAmountToken0.neg().toString()],
      [
        'totalValueLockedUSD',
        collectedAmountToken0.times(TEST_USDC_DERIVED_ETH.times(TEST_ETH_PRICE_USD)).neg().toString(),
      ],
    ])

    assertObjectMatches('Token', WETH_MAINNET_FIXTURE.address, [
      ['txCount', '1'],
      ['totalValueLocked', collectedAmountToken1.neg().toString()],
      [
        'totalValueLockedUSD',
        collectedAmountToken1.times(TEST_WETH_DERIVED_ETH.times(TEST_ETH_PRICE_USD)).neg().toString(),
      ],
    ])

    assertObjectMatches('Collect', MOCK_EVENT.transaction.hash.toHexString() + '-' + MOCK_EVENT.logIndex.toString(), [
      ['transaction', MOCK_EVENT.transaction.hash.toHexString()],
      ['pool', USDC_WETH_03_MAINNET_POOL],
      ['owner', COLLECT_FIXTURE.owner.toHexString()],
      ['amount0', collectedAmountToken0.toString()],
      ['amount1', collectedAmountToken1.toString()],
      ['amountUSD', trackedCollectedAmountUSD.toString()],
      ['tickLower', COLLECT_FIXTURE.tickLower.toString()],
      ['tickUpper', COLLECT_FIXTURE.tickUpper.toString()],
      ['logIndex', MOCK_EVENT.logIndex.toString()],
    ])
  })
})
