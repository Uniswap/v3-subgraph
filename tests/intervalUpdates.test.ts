import { beforeEach, clearStore, describe } from 'matchstick-as'

import {
  createAndStoreTestPool,
  createAndStoreTestToken,
  USDC_WETH_03_MAINNET_POOL_FIXTURE,
  WETH_MAINNET_FIXTURE,
} from './constants'

describe('uniswap interval data', () => {
  beforeEach(() => {
    clearStore()
  })
})

describe('pool interval data', () => {
  beforeEach(() => {
    clearStore()
    createAndStoreTestPool(USDC_WETH_03_MAINNET_POOL_FIXTURE)
  })
})

describe('token interval data', () => {
  beforeEach(() => {
    clearStore()

    createAndStoreTestToken(WETH_MAINNET_FIXTURE)
  })
})
