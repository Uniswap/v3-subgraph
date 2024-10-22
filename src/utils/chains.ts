import { Address, BigDecimal, BigInt, dataSource } from '@graphprotocol/graph-ts'

import { OPTIMISM_POOL_MAPPINGS } from '../backfill/poolMappings'
import { StaticTokenDefinition } from './staticTokenDefinition'

export enum ChainId {
  ARBITRUM_ONE = 42161,
  AVALANCHE = 43114,
  BASE = 8453,
  BLAST_MAINNET = 81457,
  BSC = 56,
  CELO = 42220,
  MAINNET = 1,
  MATIC = 137,
  OPTIMISM = 10,
  ZKSYNC_ERA = 324,
  ZORA_MAINNET = 7777777,
  WORLDCHAIN_MAINNET = 480,
  SEPOLIA = 11155111,
}

// subgraph does not support string enums, hence these constants
const ARBITRUM_ONE_NETWORK_NAME = 'arbitrum-one'
const AVALANCHE_NETWORK_NAME = 'avalanche'
const BASE_NETWORK_NAME = 'base'
const BLAST_MAINNET_NETWORK_NAME = 'blast-mainnet'
const BSC_NETWORK_NAME = 'bsc'
const CELO_NETWORK_NAME = 'celo'
const MAINNET_NETWORK_NAME = 'mainnet'
const MATIC_NETWORK_NAME = 'matic'
const OPTIMISM_NETWORK_NAME = 'optimism'
const ZKSYNC_ERA_NETWORK_NAME = 'zksync-era'
const ZORA_MAINNET_NETWORK_NAME = 'zora-mainnet'
const WORLDCHAIN_MAINNET_NETWORK_NAME = 'worldchain-mainnet'
const SEPOLIA_NETWORK_NAME = 'sepolia'

// Note: All token and pool addresses should be lowercased!
export class SubgraphConfig {
  // deployment address
  // e.g. https://docs.uniswap.org/contracts/v3/reference/deployments/ethereum-deployments
  factoryAddress: string

  // the address of a pool where one token is a stablecoin and the other is a
  // token that tracks the price of the native token use this to calculate the
  // price of the native token, so prefer a pool with highest liquidity
  stablecoinWrappedNativePoolAddress: string

  // true is stablecoin is token0, false if stablecoin is token1
  stablecoinIsToken0: boolean

  // the address of a token that tracks the price of the native token, most of
  // the time, this is a wrapped asset but could also be the native token itself
  // for some chains
  wrappedNativeAddress: string

  // the mimimum liquidity in a pool needed for it to be used to help calculate
  // token prices. for new chains, this should be initialized to ~4000 USD
  minimumNativeLocked: BigDecimal

  // list of stablecoin addresses
  stablecoinAddresses: string[]

  // a token must be in a pool with one of these tokens in order to derive a
  // price (in addition to passing the minimumEthLocked check). This is also
  // used to determine whether volume is tracked or not.
  whitelistTokens: string[]

  // token overrides are used to override RPC calls for the symbol, name, and
  // decimals for tokens. for new chains this is typically empty.
  tokenOverrides: StaticTokenDefinition[]

  // skip the creation of these pools in handlePoolCreated. for new chains this is typically empty.
  poolsToSkip: string[]

  // initialize this list of pools and token addresses on factory creation. for new chains this is typically empty.
  poolMappings: Array<Address[]>
}

export function getSubgraphConfig(): SubgraphConfig {
  // Update this value to the corresponding chain you want to deploy
  const selectedNetwork = dataSource.network()

  // subgraph does not support case switch with strings, hence this if else block
  if (selectedNetwork == ARBITRUM_ONE_NETWORK_NAME) {
    return {
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      stablecoinWrappedNativePoolAddress: '0x17c14d2c404d167802b16c450d3c99f88f2c4f4d', // WETH-USDC 0.3% pool
      stablecoinIsToken0: false,
      wrappedNativeAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // WETH
      minimumNativeLocked: BigDecimal.fromString('20'),
      stablecoinAddresses: [
        '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // USDC
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
        '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT
      ],
      whitelistTokens: [
        '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // WETH
        '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // USDC
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
        '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT
      ],
      tokenOverrides: [
        {
          address: Address.fromString('0x82af49447d8a07e3bd95bd0d56f35241523fbab1'),
          symbol: 'WETH',
          name: 'Wrapped Ethereum',
          decimals: BigInt.fromI32(18),
        },
        {
          address: Address.fromString('0xff970a61a04b1ca14834a43f5de4533ebddb5cc8'),
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: BigInt.fromI32(6),
        },
      ],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else if (selectedNetwork == AVALANCHE_NETWORK_NAME) {
    return {
      factoryAddress: '0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD',
      stablecoinWrappedNativePoolAddress: '0xfae3f424a0a47706811521e3ee268f00cfb5c45e', // WAVAX-USDC 0.05% pool
      stablecoinIsToken0: false,
      wrappedNativeAddress: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', // WAVAX
      minimumNativeLocked: BigDecimal.fromString('1000'),
      stablecoinAddresses: [
        '0xd586e7f844cea2f87f50152665bcbc2c279d8d70', // DAI_E
        '0xba7deebbfc5fa1100fb055a87773e1e99cd3507a', // DAI
        '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664', // USDC_E
        '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', // USDC
        '0xc7198437980c041c805a1edcba50c1ce5db95118', // USDT_E
        '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', // USDT
      ],
      whitelistTokens: [
        '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7', // WAVAX
        '0xd586e7f844cea2f87f50152665bcbc2c279d8d70', // DAI_E
        '0xba7deebbfc5fa1100fb055a87773e1e99cd3507a', // DAI
        '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664', // USDC_E
        '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', // USDC
        '0xc7198437980c041c805a1edcba50c1ce5db95118', // USDT_E
        '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', // USDT
        '0x130966628846bfd36ff31a822705796e8cb8c18d', // MIM
      ],
      tokenOverrides: [],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else if (selectedNetwork == BASE_NETWORK_NAME) {
    return {
      factoryAddress: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
      stablecoinWrappedNativePoolAddress: '0x4c36388be6f416a29c8d8eee81c771ce6be14b18', // WETH-USDbC 0.05% pool
      stablecoinIsToken0: false,
      wrappedNativeAddress: '0x4200000000000000000000000000000000000006', // WETH
      minimumNativeLocked: BigDecimal.fromString('4'),
      stablecoinAddresses: [
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
      ],
      whitelistTokens: [
        '0x4200000000000000000000000000000000000006', // WETH
        '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
      ],
      tokenOverrides: [],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else if (selectedNetwork == BLAST_MAINNET_NETWORK_NAME) {
    return {
      factoryAddress: '0x792edAdE80af5fC680d96a2eD80A44247D2Cf6Fd',
      stablecoinWrappedNativePoolAddress: '0xf52b4b69123cbcf07798ae8265642793b2e8990c', // USDB-WETH 0.3% pool
      stablecoinIsToken0: true,
      wrappedNativeAddress: '0x4300000000000000000000000000000000000004', // WETH
      minimumNativeLocked: BigDecimal.fromString('1'),
      stablecoinAddresses: [
        '0x4300000000000000000000000000000000000003', // USDB
      ],
      whitelistTokens: [
        '0x4300000000000000000000000000000000000004', // WETH
        '0x4300000000000000000000000000000000000003', // USDB
      ],
      tokenOverrides: [],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else if (selectedNetwork == BSC_NETWORK_NAME) {
    return {
      factoryAddress: '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7',
      stablecoinWrappedNativePoolAddress: '0x6fe9e9de56356f7edbfcbb29fab7cd69471a4869', // USDC-WBNB 0.3% pool
      stablecoinIsToken0: true,
      wrappedNativeAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
      minimumNativeLocked: BigDecimal.fromString('100'),
      stablecoinAddresses: [
        '0x55d398326f99059ff775485246999027b3197955', // USDT
        '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
      ],
      whitelistTokens: [
        '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
        '0x55d398326f99059ff775485246999027b3197955', // USDT
        '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
      ],
      tokenOverrides: [],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else if (selectedNetwork == CELO_NETWORK_NAME) {
    return {
      factoryAddress: '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc',
      stablecoinWrappedNativePoolAddress: '0x2d70cbabf4d8e61d5317b62cbe912935fd94e0fe', // CUSD-CELO 0.01% pool
      stablecoinIsToken0: false,
      wrappedNativeAddress: '0x471ece3750da237f93b8e339c536989b8978a438', // CELO
      minimumNativeLocked: BigDecimal.fromString('3600'),
      stablecoinAddresses: [
        '0x765de816845861e75a25fca122bb6898b8b1282a', // CUSD
        '0xef4229c8c3250c675f21bcefa42f58efbff6002a', // Bridged USDC
        '0xceba9300f2b948710d2653dd7b07f33a8b32118c', // Native USDC
      ],
      whitelistTokens: [
        '0x471ece3750da237f93b8e339c536989b8978a438', // CELO
        '0x765de816845861e75a25fca122bb6898b8b1282a', // CUSD
        '0xef4229c8c3250c675f21bcefa42f58efbff6002a', // Bridged USDC
        '0xceba9300f2b948710d2653dd7b07f33a8b32118c', // Native USDC
        '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73', // CEUR
        '0xe8537a3d056da446677b9e9d6c5db704eaab4787', // CREAL
        '0x46c9757c5497c5b1f2eb73ae79b6b67d119b0b58', // PACT
        '0x17700282592d6917f6a73d0bf8accf4d578c131e', // MOO
        '0x66803fb87abd4aac3cbb3fad7c3aa01f6f3fb207', // Portal Eth
        '0xbaab46e28388d2779e6e31fd00cf0e5ad95e327b', // WBTC
      ],
      tokenOverrides: [],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else if (selectedNetwork == MAINNET_NETWORK_NAME) {
    return {
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      stablecoinWrappedNativePoolAddress: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8', // USDC-WETH 0.3% pool
      stablecoinIsToken0: true,
      wrappedNativeAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      minimumNativeLocked: BigDecimal.fromString('20'),
      stablecoinAddresses: [
        '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
        '0x956f47f50a910163d8bf957cf5846d573e7f87ca', // FEI
      ],
      whitelistTokens: [
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
        '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
        '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
        '0x86fadb80d8d2cff3c3680819e4da99c10232ba0f', // EBASE
        '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // sUSD
        '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
        '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
        '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
        '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', // SNX
        '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', // YFI
        '0x111111111117dc0aa78b770fa6a738034120c302', // 1INCH
        '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8', // yCurv
        '0x956f47f50a910163d8bf957cf5846d573e7f87ca', // FEI
        '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', // MATIC
        '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
        '0xfe2e637202056d30016725477c5da089ab0a043a', // sETH2
      ],
      tokenOverrides: [
        {
          address: Address.fromString('0xe0b7927c4af23765cb51314a0e0521a9645f0e2a'),
          symbol: 'DGD',
          name: 'DGD',
          decimals: BigInt.fromI32(9),
        },
        {
          address: Address.fromString('0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9'),
          symbol: 'AAVE',
          name: 'Aave Token',
          decimals: BigInt.fromI32(18),
        },
        {
          address: Address.fromString('0xeb9951021698b42e4399f9cbb6267aa35f82d59d'),
          symbol: 'LIF',
          name: 'Lif',
          decimals: BigInt.fromI32(18),
        },
        {
          address: Address.fromString('0xbdeb4b83251fb146687fa19d1c660f99411eefe3'),
          symbol: 'SVD',
          name: 'savedroid',
          decimals: BigInt.fromI32(18),
        },
        {
          address: Address.fromString('0xbb9bc244d798123fde783fcc1c72d3bb8c189413'),
          symbol: 'TheDAO',
          name: 'TheDAO',
          decimals: BigInt.fromI32(16),
        },
        {
          address: Address.fromString('0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2'),
          symbol: 'HPB',
          name: 'HPBCoin',
          decimals: BigInt.fromI32(18),
        },
      ],
      poolsToSkip: ['0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248'],
      poolMappings: [],
    }
  } else if (selectedNetwork == MATIC_NETWORK_NAME) {
    return {
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      stablecoinWrappedNativePoolAddress: '0xa374094527e1673a86de625aa59517c5de346d32', // WMATIC-USDC 0.05% pool
      stablecoinIsToken0: false,
      wrappedNativeAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC
      minimumNativeLocked: BigDecimal.fromString('20000'),
      stablecoinAddresses: [
        '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC
        '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063', // DAI
      ],
      whitelistTokens: [
        '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC
        '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', // WETH
        '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC
        '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063', // DAI
      ],
      tokenOverrides: [],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else if (selectedNetwork == OPTIMISM_NETWORK_NAME) {
    return {
      factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      stablecoinWrappedNativePoolAddress: '0x03af20bdaaffb4cc0a521796a223f7d85e2aac31', // DAI-WETH 0.3% pool
      stablecoinIsToken0: false,
      wrappedNativeAddress: '0x4200000000000000000000000000000000000006', // WETH
      minimumNativeLocked: BigDecimal.fromString('10'),
      stablecoinAddresses: [
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
        '0x7f5c764cbc14f9669b88837ca1490cca17c31607', // USDC
        '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', // USDT
      ],
      whitelistTokens: [
        '0x4200000000000000000000000000000000000006', // WETH
        '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
        '0x7f5c764cbc14f9669b88837ca1490cca17c31607', // USDC
        '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', // USDT
        '0x4200000000000000000000000000000000000042', // OP
        '0x9e1028f5f1d5ede59748ffcee5532509976840e0', // PERP
        '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', // LYRA
        '0x68f180fcce6836688e9084f035309e29bf0a2095', // WBTC
      ],
      tokenOverrides: [
        {
          address: Address.fromString('0x82af49447d8a07e3bd95bd0d56f35241523fbab1'),
          symbol: 'WETH',
          name: 'Wrapped Ethereum',
          decimals: BigInt.fromI32(18),
        },
      ],
      poolsToSkip: [
        '0x282b7d6bef6c78927f394330dca297eca2bd18cd',
        '0x5738de8d0b864d5ef5d65b9e05b421b71f2c2eb4',
        '0x5500721e5a063f0396c5e025a640e8491eb89aac',
        '0x1ffd370f9d01f75de2cc701956886acec9749e80',
      ],
      poolMappings: OPTIMISM_POOL_MAPPINGS,
    }
  } else if (selectedNetwork == ZKSYNC_ERA_NETWORK_NAME) {
    return {
      factoryAddress: '0x8fda5a7a8dca67bbcdd10f02fa0649a937215422',
      stablecoinWrappedNativePoolAddress: '0x3e3dd517fec2e70eddba2a626422a4ba286e8c38', // USDC.e/WETH 0.05% pool
      stablecoinIsToken0: true,
      wrappedNativeAddress: '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91', // WETH
      minimumNativeLocked: BigDecimal.fromString('1'),
      stablecoinAddresses: [
        '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4', // USDC.e
        '0x493257fd37edb34451f62edf8d2a0c418852ba4c', // USDT
        '0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4', // USDC
      ],
      whitelistTokens: [
        '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91', // WETH
        '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4', // USDC.e
        '0x493257fd37edb34451f62edf8d2a0c418852ba4c', // USDT
        '0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4', // USDC
        '0x5a7d6b2f92c77fad6ccabd7ee0624e64907eaf3e', // ZK
      ],
      tokenOverrides: [
        {
          address: Address.fromString('0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4'),
          symbol: 'USDC.e',
          name: 'Bridged USDC (zkSync)',
          decimals: BigInt.fromI32(6),
        },
      ],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else if (selectedNetwork == ZORA_MAINNET_NETWORK_NAME) {
    return {
      factoryAddress: '0x7145f8aeef1f6510e92164038e1b6f8cb2c42cbb',
      stablecoinWrappedNativePoolAddress: '0xbc59f8f3b275aa56a90d13bae7cce5e6e11a3b17', // WETH/USDzC 3% pool
      stablecoinIsToken0: false,
      wrappedNativeAddress: '0x4200000000000000000000000000000000000006', // WETH
      minimumNativeLocked: BigDecimal.fromString('1'),
      stablecoinAddresses: [
        '0xcccccccc7021b32ebb4e8c08314bd62f7c653ec4', // USDzC
      ],
      whitelistTokens: [
        '0x4200000000000000000000000000000000000006', // WETH
        '0xcccccccc7021b32ebb4e8c08314bd62f7c653ec4', // USDzC
      ],
      tokenOverrides: [],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else if (selectedNetwork == WORLDCHAIN_MAINNET_NETWORK_NAME) {
    return {
      factoryAddress: '0x7a5028bda40e7b173c278c5342087826455ea25a',
      stablecoinWrappedNativePoolAddress: '0x5f835420502a7702de50cd0e78d8aa3608b2137e', // WETH/USDC.e 0.05% pool
      stablecoinIsToken0: false,
      wrappedNativeAddress: '0x4200000000000000000000000000000000000006', // WETH
      minimumNativeLocked: BigDecimal.fromString('1'),
      stablecoinAddresses: [
        '0x79a02482a880bce3f13e09da970dc34db4cd24d1', // USDC.e
      ],
      whitelistTokens: [
        '0x4200000000000000000000000000000000000006', // WETH
        '0x79a02482a880bce3f13e09da970dc34db4cd24d1', // USDC.e
        '0x03c7054bcb39f7b2e5b2c7acb37583e32d70cfa3', // WBTC
        '0x2cfc85d8e48f8eab294be644d9e25c3030863003', // WLD
        '0x859dbe24b90c9f2f7742083d3cf59ca41f55be5d', // sDAI
      ],
      tokenOverrides: [],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else if (selectedNetwork == SEPOLIA_NETWORK_NAME) {
    return {
      factoryAddress: '0x0227628f3f023bb0b980b67d528571c95c6dac1c',
      stablecoinWrappedNativePoolAddress: '0x6418eec70f50913ff0d756b48d32ce7c02b47c47', // USDC/WETH 1% pool
      stablecoinIsToken0: true,
      wrappedNativeAddress: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14', // WETH
      minimumNativeLocked: BigDecimal.fromString('1'),
      stablecoinAddresses: [
        '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // USDC
        '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0', // USDT
      ],
      whitelistTokens: [
        '0xfff9976782d46cc05630d1f6ebab18b2324d6b14', // WETH
        '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', // USDC
        '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0', // USDT
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI,
      ],
      tokenOverrides: [],
      poolsToSkip: [],
      poolMappings: [],
    }
  } else {
    throw new Error('Unsupported Network')
  }
}
