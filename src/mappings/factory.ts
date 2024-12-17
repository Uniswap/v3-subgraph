import { BigInt } from '@graphprotocol/graph-ts'

import { PoolCreated } from '../types/Factory/Factory'
import { Pool, Token } from '../types/schema'
import { Pool as PoolTemplate } from '../types/templates'
import { getSubgraphConfig, SubgraphConfig } from '../utils/chains'
import { fetchTokenSymbol } from '../utils/token'
import { ZERO_BI } from './../utils/constants'

// The subgraph handler must have this signature to be able to handle events,
// however, we invoke a helper in order to inject dependencies for unit tests.
export function handlePoolCreated(event: PoolCreated): void {
  handlePoolCreatedHelper(event)
}

// Exported for unit tests
export function handlePoolCreatedHelper(
  event: PoolCreated,
  subgraphConfig: SubgraphConfig = getSubgraphConfig(),
): void {
  const tokenOverrides = subgraphConfig.tokenOverrides
  const poolsToSkip = subgraphConfig.poolsToSkip

  // temp fix
  if (poolsToSkip.includes(event.params.pool.toHexString())) {
    return
  }

  const pool = new Pool(event.params.pool.toHexString()) as Pool
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.token0, tokenOverrides)
  }

  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.token1, tokenOverrides)
  }

  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.feeTier = BigInt.fromI32(event.params.fee)
  pool.liquidity = ZERO_BI

  pool.save()
  // create the tracked contract based on the template
  PoolTemplate.create(event.params.pool)
  token0.save()
  token1.save()
}
