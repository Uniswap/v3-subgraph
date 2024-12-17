import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Pool as PoolABI } from '../types/Factory/Pool'
import { Pool, Token } from '../types/schema'
import { Pool as PoolTemplate } from '../types/templates'
import { StaticTokenDefinition } from '../utils/staticTokenDefinition'
import { fetchTokenSymbol } from '../utils/token'

function populateToken(tokenAddress: string, tokenOverrides: StaticTokenDefinition[]): void {
  let token = Token.load(tokenAddress)
  if (token != null) {
    return
  }
  token = new Token(tokenAddress)
  token.symbol = fetchTokenSymbol(Address.fromString(tokenAddress), tokenOverrides)
  token.save()
}

/**
 * Create entries in store for hard-coded pools and tokens. This is only
 * used for generating optimism pre-regenesis data.
 */
export function populateEmptyPools(poolMappings: Array<Address[]>, tokenOverrides: StaticTokenDefinition[]): void {
  const length = poolMappings.length
  for (let i = 0; i < length; ++i) {
    const poolMapping = poolMappings[i]
    const newAddress = poolMapping[1]
    const token0Address = poolMapping[2]
    const token1Address = poolMapping[3]

    const poolContract = PoolABI.bind(newAddress)
    const pool = new Pool(newAddress.toHexString()) as Pool
    pool.token0 = token0Address.toHexString()
    pool.token1 = token1Address.toHexString()
    pool.liquidity = poolContract.liquidity()

    // need fee tier
    const feeTier = poolContract.fee()
    pool.feeTier = BigInt.fromI32(feeTier)

    // create token entities if needed
    populateToken(token0Address.toHexString(), tokenOverrides)
    populateToken(token1Address.toHexString(), tokenOverrides)
    const token0 = Token.load(token0Address.toHexString())
    const token1 = Token.load(token1Address.toHexString())

    if (token0 && token1) {
      // add pool to tracked address and store entities
      PoolTemplate.create(Address.fromString(pool.id))
      token0.save()
      token1.save()
      pool.save()
    }
  }
}
