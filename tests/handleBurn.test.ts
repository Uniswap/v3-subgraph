import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { beforeAll, describe, test } from 'matchstick-as'

import { handleBurnHelper } from '../src/mappings/pool/burn'
import { Pool, Token } from '../src/types/schema'
import { Burn } from '../src/types/templates/Pool/Pool'
import {
  assertObjectMatches,
  invokePoolCreatedWithMockedEthCalls,
  MOCK_EVENT,
  TEST_CONFIG,
  USDC_MAINNET_FIXTURE,
  USDC_WETH_03_MAINNET_POOL,
  WETH_MAINNET_FIXTURE,
} from './constants'

class BurnFixture {
  owner: Address
  tickLower: i32
  tickUpper: i32
  amount: BigInt
  amount0: BigInt
  amount1: BigInt
}

// https://etherscan.io/tx/0x26b168e005a168b28d518675435c9f51816697c086deef7377e0018e4eb65dc9
const BURN_FIXTURE: BurnFixture = {
  owner: Address.fromString('0x8692f704a20d11be3b32de68656651b5291ed26c'),
  tickLower: 194280,
  tickUpper: 194520,
  amount: BigInt.fromString('107031367278175302'),
  amount0: BigInt.fromString('77186598043'),
  amount1: BigInt.fromString('0'),
}

const BURN_EVENT = new Burn(
  Address.fromString(USDC_WETH_03_MAINNET_POOL),
  MOCK_EVENT.logIndex,
  MOCK_EVENT.transactionLogIndex,
  MOCK_EVENT.logType,
  MOCK_EVENT.block,
  MOCK_EVENT.transaction,
  [
    new ethereum.EventParam('owner', ethereum.Value.fromAddress(BURN_FIXTURE.owner)),
    new ethereum.EventParam('tickLower', ethereum.Value.fromI32(BURN_FIXTURE.tickLower)),
    new ethereum.EventParam('tickUpper', ethereum.Value.fromI32(BURN_FIXTURE.tickUpper)),
    new ethereum.EventParam('amount', ethereum.Value.fromUnsignedBigInt(BURN_FIXTURE.amount)),
    new ethereum.EventParam('amount0', ethereum.Value.fromUnsignedBigInt(BURN_FIXTURE.amount0)),
    new ethereum.EventParam('amount1', ethereum.Value.fromUnsignedBigInt(BURN_FIXTURE.amount1)),
  ],
  MOCK_EVENT.receipt,
)

describe('handleBurn', () => {
  beforeAll(() => {
    invokePoolCreatedWithMockedEthCalls(MOCK_EVENT, TEST_CONFIG)

    const usdcEntity = Token.load(USDC_MAINNET_FIXTURE.address)!
    usdcEntity.save()

    const wethEntity = Token.load(WETH_MAINNET_FIXTURE.address)!
    wethEntity.save()
  })

  // note: all tvl should be zero in this test because burns don't remove TVL, only collects do
  test('success - burn event, pool tick is between tickUpper and tickLower', () => {
    // put the pools tick in range
    const pool = Pool.load(USDC_WETH_03_MAINNET_POOL)!
    pool.tick = BigInt.fromI32(BURN_FIXTURE.tickLower + BURN_FIXTURE.tickUpper).div(BigInt.fromI32(2))
    pool.save()

    handleBurnHelper(BURN_EVENT)

    assertObjectMatches('Pool', USDC_WETH_03_MAINNET_POOL, [['liquidity', BURN_FIXTURE.amount.neg().toString()]])

    assertObjectMatches('Token', USDC_MAINNET_FIXTURE.address, [])

    assertObjectMatches('Token', WETH_MAINNET_FIXTURE.address, [])
  })

  test('success - burn event, pool tick is not between tickUpper and tickLower', () => {
    // put the pools tick out of range
    const pool = Pool.load(USDC_WETH_03_MAINNET_POOL)!
    pool.tick = BigInt.fromI32(BURN_FIXTURE.tickLower - 1)
    const liquidityBeforeBurn = pool.liquidity
    pool.save()

    handleBurnHelper(BURN_EVENT)

    // liquidity should not be updated
    assertObjectMatches('Pool', USDC_WETH_03_MAINNET_POOL, [['liquidity', liquidityBeforeBurn.toString()]])
  })
})
