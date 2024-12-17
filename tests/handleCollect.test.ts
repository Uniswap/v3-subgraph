import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { beforeAll, describe, test } from 'matchstick-as'

import { handleCollectHelper } from '../src/mappings/pool/collect'
import { Token } from '../src/types/schema'
import { Collect } from '../src/types/templates/Pool/Pool'
import {
  assertObjectMatches,
  invokePoolCreatedWithMockedEthCalls,
  MOCK_EVENT,
  TEST_CONFIG,
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

    const usdcEntity = Token.load(USDC_MAINNET_FIXTURE.address)!
    usdcEntity.save()

    const wethEntity = Token.load(WETH_MAINNET_FIXTURE.address)!
    wethEntity.save()
  })

  test('success - collect event', () => {
    // pass in empty whitelist to simplify this test. Doing so ignores the
    // effect of getTrackedAmountUSD which we test separately.
    handleCollectHelper(COLLECT_EVENT)

    assertObjectMatches('Pool', USDC_WETH_03_MAINNET_POOL, [])

    assertObjectMatches('Token', USDC_MAINNET_FIXTURE.address, [])

    assertObjectMatches('Token', WETH_MAINNET_FIXTURE.address, [])
  })
})
