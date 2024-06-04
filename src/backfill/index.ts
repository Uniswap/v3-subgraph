import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'

import { ERC20 } from '../types/Factory/ERC20'
import { Pool as PoolABI } from '../types/Factory/Pool'
import { Pool, Token } from '../types/schema'
import { Pool as PoolTemplate } from '../types/templates'
import { convertTokenToDecimal } from '../utils'
import { ZERO_BD, ZERO_BI } from '../utils/constants'
import { StaticTokenDefinition } from '../utils/staticTokenDefinition'
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol, fetchTokenTotalSupply } from '../utils/token'

function populateToken(tokenAddress: string, tokenOverrides: StaticTokenDefinition[]): void {
  let token = Token.load(tokenAddress)
  if (token != null) {
    return
  }
  token = new Token(tokenAddress)
  token.symbol = fetchTokenSymbol(Address.fromString(tokenAddress), tokenOverrides)
  token.name = fetchTokenName(Address.fromString(tokenAddress), tokenOverrides)
  token.totalSupply = fetchTokenTotalSupply(Address.fromString(tokenAddress))
  const decimals = fetchTokenDecimals(Address.fromString(tokenAddress), tokenOverrides)
  if (decimals === null) {
    return
  }
  token.decimals = decimals
  token.derivedETH = ZERO_BD
  token.volume = ZERO_BD
  token.volumeUSD = ZERO_BD
  token.feesUSD = ZERO_BD
  token.untrackedVolumeUSD = ZERO_BD
  token.totalValueLocked = ZERO_BD
  token.totalValueLockedUSD = ZERO_BD
  token.totalValueLockedUSDUntracked = ZERO_BD
  token.txCount = ZERO_BI
  token.poolCount = ZERO_BI
  token.whitelistPools = []
  token.save()
}

/**
 * Create entries in store for hard-coded pools and tokens. This is only
 * used for generating optimism pre-regenesis data.
 */
export function populateEmptyPools(
  event: ethereum.Event,
  poolMappings: Array<Address[]>,
  whitelistTokens: string[],
  tokenOverrides: StaticTokenDefinition[],
): void {
  const length = poolMappings.length
  for (let i = 0; i < length; ++i) {
    const poolMapping = poolMappings[i]
    const newAddress = poolMapping[1]
    const token0Address = poolMapping[2]
    const token1Address = poolMapping[3]

    const poolContract = PoolABI.bind(newAddress)
    const pool = new Pool(newAddress.toHexString()) as Pool
    pool.createdAtBlockNumber = event.block.number
    pool.createdAtTimestamp = event.block.timestamp
    pool.token0 = token0Address.toHexString()
    pool.token1 = token1Address.toHexString()
    pool.liquidity = poolContract.liquidity()
    pool.sqrtPrice = ZERO_BI
    pool.token0Price = ZERO_BD
    pool.token1Price = ZERO_BD
    pool.observationIndex = ZERO_BI
    pool.liquidityProviderCount = ZERO_BI
    pool.txCount = ZERO_BI
    pool.totalValueLockedToken0 = ZERO_BD
    pool.totalValueLockedToken1 = ZERO_BD
    pool.totalValueLockedETH = ZERO_BD
    pool.totalValueLockedUSD = ZERO_BD
    pool.totalValueLockedUSDUntracked = ZERO_BD
    pool.volumeToken0 = ZERO_BD
    pool.volumeToken1 = ZERO_BD
    pool.volumeUSD = ZERO_BD
    pool.untrackedVolumeUSD = ZERO_BD
    pool.feesUSD = ZERO_BD
    pool.collectedFeesToken0 = ZERO_BD
    pool.collectedFeesToken1 = ZERO_BD
    pool.collectedFeesUSD = ZERO_BD

    // need fee tier
    const feeTier = poolContract.fee()
    pool.feeTier = BigInt.fromI32(feeTier)

    // create token entities if needed
    populateToken(token0Address.toHexString(), tokenOverrides)
    populateToken(token1Address.toHexString(), tokenOverrides)
    const token0 = Token.load(token0Address.toHexString())
    const token1 = Token.load(token1Address.toHexString())

    if (token0 && token1) {
      if (whitelistTokens.includes(pool.token0)) {
        const newPools = token1.whitelistPools
        newPools.push(pool.id)
        token1.whitelistPools = newPools
      }

      if (whitelistTokens.includes(token1.id)) {
        const newPools = token0.whitelistPools
        newPools.push(pool.id)
        token0.whitelistPools = newPools
      }

      // populate the TVL by call contract balanceOf
      const token0Contract = ERC20.bind(Address.fromString(pool.token0))
      const tvlToken0Raw = token0Contract.balanceOf(Address.fromString(pool.id))
      const tvlToken0Adjusted = convertTokenToDecimal(tvlToken0Raw, token0.decimals)
      pool.totalValueLockedToken0 = tvlToken0Adjusted
      token0.totalValueLocked = tvlToken0Adjusted

      const token1Contract = ERC20.bind(Address.fromString(pool.token1))
      const tvlToken1Raw = token1Contract.balanceOf(Address.fromString(pool.id))
      const tvlToken1Adjusted = convertTokenToDecimal(tvlToken1Raw, token1.decimals)
      pool.totalValueLockedToken1 = tvlToken1Adjusted
      token1.totalValueLocked = tvlToken1Adjusted

      // add pool to tracked address and store entities
      PoolTemplate.create(Address.fromString(pool.id))
      token0.save()
      token1.save()
      pool.save()
    }
  }
}
