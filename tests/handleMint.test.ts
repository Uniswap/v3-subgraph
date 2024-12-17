import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { beforeAll, describe, test } from 'matchstick-as'

import { handleMintHelper } from '../src/mappings/pool/mint'
import { Pool, Token } from '../src/types/schema'
import { Mint } from '../src/types/templates/Pool/Pool'
import {
  assertObjectMatches,
  invokePoolCreatedWithMockedEthCalls,
  MOCK_EVENT,
  TEST_CONFIG,
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

// https://etherscan.io/tx/0x0338617bb36e23bbd4074b068ea79edd07f7ef0db13fc0cd06ab8e57b9012764
const MINT_FIXTURE: MintFixture = {
  sender: Address.fromString('0xc36442b4a4522e871399cd717abdd847ab11fe88'),
  owner: Address.fromString('0xc36442b4a4522e871399cd717abdd847ab11fe88'),
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

describe('handleMint', () => {
  beforeAll(() => {
    invokePoolCreatedWithMockedEthCalls(MOCK_EVENT, TEST_CONFIG)

    const usdcEntity = Token.load(USDC_MAINNET_FIXTURE.address)!
    usdcEntity.save()

    const wethEntity = Token.load(WETH_MAINNET_FIXTURE.address)!
    wethEntity.save()
  })

  test('success - mint event, pool tick is between tickUpper and tickLower', () => {
    // put the pools tick in range
    const pool = Pool.load(USDC_WETH_03_MAINNET_POOL)!
    pool.tick = BigInt.fromI32(MINT_FIXTURE.tickLower + MINT_FIXTURE.tickUpper).div(BigInt.fromI32(2))
    pool.save()

    handleMintHelper(MINT_EVENT)

    assertObjectMatches('Pool', USDC_WETH_03_MAINNET_POOL, [['liquidity', MINT_FIXTURE.amount.toString()]])

    assertObjectMatches('Token', USDC_MAINNET_FIXTURE.address, [])

    assertObjectMatches('Token', WETH_MAINNET_FIXTURE.address, [])
  })

  test('success - mint event, pool tick is not between tickUpper and tickLower', () => {
    // put the pools tick out of range
    const pool = Pool.load(USDC_WETH_03_MAINNET_POOL)!
    pool.tick = BigInt.fromI32(MINT_FIXTURE.tickLower - 1)
    const liquidityBeforeMint = pool.liquidity
    pool.save()

    handleMintHelper(MINT_EVENT)

    // liquidity should not be updated
    assertObjectMatches('Pool', USDC_WETH_03_MAINNET_POOL, [['liquidity', liquidityBeforeMint.toString()]])
  })
})
