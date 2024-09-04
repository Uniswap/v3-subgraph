import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { beforeAll, describe, log, test } from 'matchstick-as'

import { handleSwapHelper } from '../src/mappings/pool/swap'
import { Bundle, Pool, Token } from '../src/types/schema'
import { Swap } from '../src/types/templates/Pool/Pool'
import { convertTokenToDecimal, safeDiv } from '../src/utils'
import { FACTORY_ADDRESS, ZERO_BD } from '../src/utils/constants'
import { findEthPerToken, getEthPriceInUSD, getTrackedAmountUSD, sqrtPriceX96ToTokenPrices } from '../src/utils/pricing'
import {
  assertObjectMatches,
  invokePoolCreatedWithMockedEthCalls,
  MOCK_EVENT,
  POOL_FEE_TIER_03,
  POOL_TICK_SPACING_03,
  TEST_ETH_PRICE_USD,
  TEST_USDC_DERIVED_ETH,
  TEST_WETH_DERIVED_ETH,
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
  sender: Address.fromString('0xb355bef3e04a5fd0f1c222c35ccac98310a1d780'),
  recipient: Address.fromString('0xb355bef3e04a5fd0f1c222c35ccac98310a1d780'),
  amount0: BigInt.fromString('-2485252684'),
  amount1: BigInt.fromString('2484716359'),
  sqrtPriceX96: BigInt.fromString('79215655328780617740881893822'),
  liquidity: BigInt.fromString('30666045442814581'),
  tick: -4,
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
    invokePoolCreatedWithMockedEthCalls(
      MOCK_EVENT,
      FACTORY_ADDRESS,
      {
        address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
        symbol: 'USDC',
        name: 'USD Coin',
        totalSupply: '1000000000000000000000000000',
        decimals: '6',
      },
      {
        address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        symbol: 'USDT',
        name: 'Tether USD',
        totalSupply: '1000000000000000000000000000',
        decimals: '6',
      },
      '0xbe3ad6a5669dc0b8b12febc03608860c31e2eef6',
      100,
      10,
    )

    const bundle = new Bundle('1')
    bundle.ethPriceUSD = BigDecimal.fromString('2670.8228073283731558117071429452')
    bundle.save()

    const usdcEntity = Token.load('0xaf88d065e77c8cc2239327c5edb3a432268e5831')!
    usdcEntity.derivedETH = BigDecimal.fromString('2669.979626355292546166595518605033')
    usdcEntity.save()

    const usdtEntity = Token.load('0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9')!
    usdtEntity.derivedETH = BigDecimal.fromString('0.0003744164522094601418461514372116161')
    usdtEntity.save()
  })

  test('success', () => {
    const whitelistTokens = [
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // WETH
      '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // USDC
      '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT
    ]
    const bundle = Bundle.load('1')!

    const pool = Pool.load("0xbe3ad6a5669dc0b8b12febc03608860c31e2eef6")!

    const token0 = Token.load(pool.token0)
    const token1 = Token.load(pool.token1)


    if (token0 && token1) {
      // amounts - 0/1 are token deltas: can be positive or negative
      const amount0 = convertTokenToDecimal(SWAP_EVENT.params.amount0, token0.decimals)
      const amount1 = convertTokenToDecimal(SWAP_EVENT.params.amount1, token1.decimals)

      // need absolute amounts for volume
      let amount0Abs = amount0
      if (amount0.lt(ZERO_BD)) {
        amount0Abs = amount0.times(BigDecimal.fromString('-1'))
      }
      let amount1Abs = amount1
      if (amount1.lt(ZERO_BD)) {
        amount1Abs = amount1.times(BigDecimal.fromString('-1'))
      }


      // get amount that should be tracked only - div 2 because cant count both input and output as volume
      const amountTotalUSDTracked = getTrackedAmountUSD(
        amount0Abs,
        token0 as Token,
        amount1Abs,
        token1 as Token,
        whitelistTokens,
      ).div(BigDecimal.fromString('2'))
      log.info('amountTotalUSDTracked: {}', [amountTotalUSDTracked.toString()])
    }



  })
})
