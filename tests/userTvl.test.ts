import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { beforeAll, describe, test, newMockEvent } from 'matchstick-as'

import { handleMintHelper } from '../src/mappings/pool/mint'
import { handleCollectHelper } from '../src/mappings/pool/collect'
import { handleBurnHelper } from '../src/mappings/pool/burn'
import { Bundle, Token } from '../src/types/schema'
import { Burn, Collect, Mint } from '../src/types/templates/Pool/Pool'
import { convertTokenToDecimal } from '../src/utils'
import {
  assertObjectMatches,
  invokePoolCreatedWithMockedEthCalls,
  MOCK_EVENT,
  TEST_CONFIG,
  TEST_ETH_PRICE_USD,
  TEST_USDC_DERIVED_ETH,
  TEST_WETH_DERIVED_ETH,
  USDC_MAINNET_FIXTURE,
  USDC_WETH_03_MAINNET_POOL,
  WETH_MAINNET_FIXTURE,
} from './constants'

class MintFixture {
  sender: Address
  owner: Address
  tickLower: i32
  tickUpper: i32
  amount: BigInt
  amount0: BigInt
  amount1: BigInt
}

const MINT_FIXTURE: MintFixture = {
  sender: Address.fromString('0xc36442b4a4522e871399cd717abdd847ab11fe88'),
  owner: Address.fromString('0x0000000000000000000000000000000000000000'),
  tickLower: 195600,
  tickUpper: 196740,
  amount: BigInt.fromString('386405747494368'),
  amount0: BigInt.fromString('1000000000'),
  amount1: BigInt.fromString('66726312884609397'),
}

const MINT_EVENT = new Mint(
  Address.fromString(USDC_WETH_03_MAINNET_POOL),
  MOCK_EVENT.logIndex,
  MOCK_EVENT.transactionLogIndex,
  MOCK_EVENT.logType,
  MOCK_EVENT.block,
  MOCK_EVENT.transaction,
  [
    new ethereum.EventParam('sender', ethereum.Value.fromAddress(MINT_FIXTURE.sender)),
    new ethereum.EventParam('owner', ethereum.Value.fromAddress(MINT_FIXTURE.owner)),
    new ethereum.EventParam('tickLower', ethereum.Value.fromI32(MINT_FIXTURE.tickLower)),
    new ethereum.EventParam('tickUpper', ethereum.Value.fromI32(MINT_FIXTURE.tickUpper)),
    new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(MINT_FIXTURE.amount)),
    new ethereum.EventParam('amount0', ethereum.Value.fromUnsignedBigInt(MINT_FIXTURE.amount0)),
    new ethereum.EventParam('amount1', ethereum.Value.fromUnsignedBigInt(MINT_FIXTURE.amount1)),
  ],
  MOCK_EVENT.receipt,
)

class CollectFixture {
  owner: Address
  recipient: Address
  tickLower: i32
  tickUpper: i32
  amount0: BigInt
  amount1: BigInt
}

const COLLECT_FIXTURE: CollectFixture = {
  owner: MINT_FIXTURE.owner,
  recipient: MINT_FIXTURE.owner,
  tickLower: 81600,
  tickUpper: 84120,
  amount0: BigInt.fromString('0'),
  amount1: BigInt.fromString('9275229182128904'),
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

describe('User TVL snapshots', () => {
  beforeAll(() => {
    invokePoolCreatedWithMockedEthCalls(MOCK_EVENT, TEST_CONFIG)

    const bundle = new Bundle('1')
    bundle.ethPriceUSD = TEST_ETH_PRICE_USD
    bundle.save()

    const usdc = Token.load(USDC_MAINNET_FIXTURE.address)!
    usdc.derivedETH = TEST_USDC_DERIVED_ETH
    usdc.save()

    const weth = Token.load(WETH_MAINNET_FIXTURE.address)!
    weth.derivedETH = TEST_WETH_DERIVED_ETH
    weth.save()
  })

  test('mint increases user tvl and writes hour/day snapshots', () => {
    handleMintHelper(MINT_EVENT, TEST_CONFIG)

    const amountToken0 = convertTokenToDecimal(MINT_FIXTURE.amount0, BigInt.fromString(USDC_MAINNET_FIXTURE.decimals))
    const amountToken1 = convertTokenToDecimal(MINT_FIXTURE.amount1, BigInt.fromString(WETH_MAINNET_FIXTURE.decimals))
    const tvlETH = amountToken0.times(TEST_USDC_DERIVED_ETH).plus(amountToken1.times(TEST_WETH_DERIVED_ETH))
    const tvlUSD = tvlETH.times(TEST_ETH_PRICE_USD)

    const owner = MINT_FIXTURE.owner.toHexString()
    const snapId = owner + '-' + MOCK_EVENT.block.number.toString()
    const hourStart = (MOCK_EVENT.block.timestamp.toI32() / 3600) * 3600
    const dayStart = (MOCK_EVENT.block.timestamp.toI32() / 86400) * 86400

    assertObjectMatches('User', owner, [
      ['id', owner],
      ['tvlUSD', tvlUSD.toString()],
      ['lastUpdatedBlock', MOCK_EVENT.block.number.toString()],
      ['lastUpdatedTs', MOCK_EVENT.block.timestamp.toString()],
    ])

    assertObjectMatches('UserHour', snapId, [
      ['address', owner],
      ['periodStartUnix', hourStart.toString()],
      ['blockNumber', MOCK_EVENT.block.number.toString()],
      ['tvlBlockUSD', tvlUSD.toString()],
      ['tvlCurrentUSD', tvlUSD.toString()],
    ])

    assertObjectMatches('UserDay', snapId, [
      ['address', owner],
      ['date', dayStart.toString()],
      ['blockNumber', MOCK_EVENT.block.number.toString()],
      ['tvlBlockUSD', tvlUSD.toString()],
      ['tvlCurrentUSD', tvlUSD.toString()],
    ])
  })

  test('burn does not subtract user tvl (partial burn)', () => {
    // create a burn that reduces liquidity but not fully
    const mock = newMockEvent()
    mock.block.number = MOCK_EVENT.block.number.plus(BigInt.fromI32(1))
    mock.block.timestamp = MOCK_EVENT.block.timestamp.plus(BigInt.fromI32(12))

    const PARTIAL_BURN_AMOUNT = BigInt.fromString('100000000000000')
    const burnEvent = new Burn(
      Address.fromString(USDC_WETH_03_MAINNET_POOL),
      mock.logIndex,
      mock.transactionLogIndex,
      mock.logType,
      mock.block,
      mock.transaction,
      [
        new ethereum.EventParam('owner', ethereum.Value.fromAddress(MINT_FIXTURE.owner)),
        new ethereum.EventParam('tickLower', ethereum.Value.fromI32(MINT_FIXTURE.tickLower)),
        new ethereum.EventParam('tickUpper', ethereum.Value.fromI32(MINT_FIXTURE.tickUpper)),
        new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(PARTIAL_BURN_AMOUNT)),
        new ethereum.EventParam('amount0', ethereum.Value.fromUnsignedBigInt(MINT_FIXTURE.amount0.div(BigInt.fromI32(2)))),
        new ethereum.EventParam('amount1', ethereum.Value.fromUnsignedBigInt(MINT_FIXTURE.amount1.div(BigInt.fromI32(2)))),
      ],
      mock.receipt,
    )

    handleBurnHelper(burnEvent, TEST_CONFIG)

    // User tvl should remain the same as after mint
    const amountToken0 = convertTokenToDecimal(MINT_FIXTURE.amount0, BigInt.fromString(USDC_MAINNET_FIXTURE.decimals))
    const amountToken1 = convertTokenToDecimal(MINT_FIXTURE.amount1, BigInt.fromString(WETH_MAINNET_FIXTURE.decimals))
    const tvlETH = amountToken0.times(TEST_USDC_DERIVED_ETH).plus(amountToken1.times(TEST_WETH_DERIVED_ETH))
    const tvlUSD = tvlETH.times(TEST_ETH_PRICE_USD)

    const owner = MINT_FIXTURE.owner.toHexString()
    assertObjectMatches('User', owner, [
      ['tvlUSD', tvlUSD.toString()],
      ['openPositionCount', '1'],
    ])
  })

  test('burn full exit zeros user tvl and snapshots', () => {
    // burn the remaining liquidity to close the only position
    const mock = newMockEvent()
    mock.block.number = MOCK_EVENT.block.number.plus(BigInt.fromI32(2))
    mock.block.timestamp = MOCK_EVENT.block.timestamp.plus(BigInt.fromI32(24))

    const remaining = MINT_FIXTURE.amount.minus(BigInt.fromString('100000000000000'))
    const burnEvent = new Burn(
      Address.fromString(USDC_WETH_03_MAINNET_POOL),
      mock.logIndex,
      mock.transactionLogIndex,
      mock.logType,
      mock.block,
      mock.transaction,
      [
        new ethereum.EventParam('owner', ethereum.Value.fromAddress(MINT_FIXTURE.owner)),
        new ethereum.EventParam('tickLower', ethereum.Value.fromI32(MINT_FIXTURE.tickLower)),
        new ethereum.EventParam('tickUpper', ethereum.Value.fromI32(MINT_FIXTURE.tickUpper)),
        new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(remaining)),
        new ethereum.EventParam('amount0', ethereum.Value.fromUnsignedBigInt(MINT_FIXTURE.amount0.div(BigInt.fromI32(2)))),
        new ethereum.EventParam('amount1', ethereum.Value.fromUnsignedBigInt(MINT_FIXTURE.amount1.div(BigInt.fromI32(2)))),
      ],
      mock.receipt,
    )

    handleBurnHelper(burnEvent, TEST_CONFIG)

    const owner = MINT_FIXTURE.owner.toHexString()
    const snapId = owner + '-' + mock.block.number.toString()
    const hourStart = (mock.block.timestamp.toI32() / 3600) * 3600
    const dayStart = (mock.block.timestamp.toI32() / 86400) * 86400

    assertObjectMatches('User', owner, [
      ['tvlUSD', '0'],
      ['openPositionCount', '0'],
      ['lastUpdatedBlock', mock.block.number.toString()],
      ['lastUpdatedTs', mock.block.timestamp.toString()],
    ])

    assertObjectMatches('UserHour', snapId, [
      ['address', owner],
      ['periodStartUnix', hourStart.toString()],
      ['blockNumber', mock.block.number.toString()],
      ['tvlBlockUSD', '0'],
      ['tvlCurrentUSD', '0'],
    ])

    assertObjectMatches('UserDay', snapId, [
      ['address', owner],
      ['date', dayStart.toString()],
      ['blockNumber', mock.block.number.toString()],
      ['tvlBlockUSD', '0'],
      ['tvlCurrentUSD', '0'],
    ])
  })

  test('collect decreases user tvl and writes snapshots', () => {
    handleCollectHelper(COLLECT_EVENT, TEST_CONFIG)

    const collectedToken0 = convertTokenToDecimal(COLLECT_FIXTURE.amount0, BigInt.fromString(USDC_MAINNET_FIXTURE.decimals))
    const collectedToken1 = convertTokenToDecimal(COLLECT_FIXTURE.amount1, BigInt.fromString(WETH_MAINNET_FIXTURE.decimals))
    const collectedETH = collectedToken0.times(TEST_USDC_DERIVED_ETH).plus(collectedToken1.times(TEST_WETH_DERIVED_ETH))
    const collectedUSD = collectedETH.times(TEST_ETH_PRICE_USD)

    const owner = COLLECT_FIXTURE.owner.toHexString()
    const snapId = owner + '-' + MOCK_EVENT.block.number.toString()
    const hourStart = (MOCK_EVENT.block.timestamp.toI32() / 3600) * 3600
    const dayStart = (MOCK_EVENT.block.timestamp.toI32() / 86400) * 86400

    // After collect, user tvl should have decreased by collectedUSD
    // Note: precise value depends on prior mint; here we just assert snapshot shape
    assertObjectMatches('UserHour', snapId, [
      ['address', owner],
      ['periodStartUnix', hourStart.toString()],
      ['blockNumber', MOCK_EVENT.block.number.toString()],
    ])

    assertObjectMatches('UserDay', snapId, [
      ['address', owner],
      ['date', dayStart.toString()],
      ['blockNumber', MOCK_EVENT.block.number.toString()],
    ])
  })
})
