import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { beforeAll, describe, test } from 'matchstick-as'

import { handleSwapHelper } from '../src/mappings/pool/swap'
import { Token } from '../src/types/schema'
import { Swap } from '../src/types/templates/Pool/Pool'
import {
  assertObjectMatches,
  invokePoolCreatedWithMockedEthCalls,
  MOCK_EVENT,
  TEST_CONFIG,
  USDC_MAINNET_FIXTURE,
  USDC_WETH_03_MAINNET_POOL,
  WETH_MAINNET_FIXTURE,
} from './constants'

class SwapFixture {
  sender: Address
  recipient: Address
  amount0: BigInt
  amount1: BigInt
  sqrtPriceX96: BigInt
  liquidity: BigInt
  tick: i32
}

// https://etherscan.io/tx/0xd6005a794596212a1bdc19178e04e18eb8e9e0963d7073303bcb47d6186e757e#eventlog
const SWAP_FIXTURE: SwapFixture = {
  sender: Address.fromString('0x6F1cDbBb4d53d226CF4B917bF768B94acbAB6168'),
  recipient: Address.fromString('0x6F1cDbBb4d53d226CF4B917bF768B94acbAB6168'),
  amount0: BigInt.fromString('-77505140556'),
  amount1: BigInt.fromString('20824112148200096620'),
  sqrtPriceX96: BigInt.fromString('1296814378469562426931209291431936'),
  liquidity: BigInt.fromString('8433670604946078834'),
  tick: 194071,
}

const SWAP_EVENT = new Swap(
  Address.fromString(USDC_WETH_03_MAINNET_POOL),
  MOCK_EVENT.logIndex,
  MOCK_EVENT.transactionLogIndex,
  MOCK_EVENT.logType,
  MOCK_EVENT.block,
  MOCK_EVENT.transaction,
  [
    new ethereum.EventParam('sender', ethereum.Value.fromAddress(SWAP_FIXTURE.sender)),
    new ethereum.EventParam('recipient', ethereum.Value.fromAddress(SWAP_FIXTURE.recipient)),
    new ethereum.EventParam('amount0', ethereum.Value.fromUnsignedBigInt(SWAP_FIXTURE.amount0)),
    new ethereum.EventParam('amount1', ethereum.Value.fromUnsignedBigInt(SWAP_FIXTURE.amount1)),
    new ethereum.EventParam('sqrtPriceX96', ethereum.Value.fromUnsignedBigInt(SWAP_FIXTURE.sqrtPriceX96)),
    new ethereum.EventParam('liquidity', ethereum.Value.fromUnsignedBigInt(SWAP_FIXTURE.liquidity)),
    new ethereum.EventParam('tick', ethereum.Value.fromI32(SWAP_FIXTURE.tick)),
  ],
  MOCK_EVENT.receipt,
)

describe('handleSwap', () => {
  beforeAll(() => {
    invokePoolCreatedWithMockedEthCalls(MOCK_EVENT, TEST_CONFIG)

    const usdcEntity = Token.load(USDC_MAINNET_FIXTURE.address)!
    usdcEntity.save()

    const wethEntity = Token.load(WETH_MAINNET_FIXTURE.address)!
    wethEntity.save()
  })

  test('success', () => {
    handleSwapHelper(SWAP_EVENT)

    assertObjectMatches('Pool', USDC_WETH_03_MAINNET_POOL, [['liquidity', SWAP_FIXTURE.liquidity.toString()]])

    assertObjectMatches('Token', USDC_MAINNET_FIXTURE.address, [])

    assertObjectMatches('Token', WETH_MAINNET_FIXTURE.address, [])
  })
})
