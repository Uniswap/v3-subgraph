import { Address, BigInt } from '@graphprotocol/graph-ts'

// Initialize a Token Definition with the attributes
export class StaticTokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const getStaticDefinition = (
  tokenAddress: Address,
  staticDefinitions: Array<StaticTokenDefinition>,
): StaticTokenDefinition | null => {
  const tokenAddressHex = tokenAddress.toHexString()

  // Search the definition using the address
  for (let i = 0; i < staticDefinitions.length; i++) {
    const staticDefinition = staticDefinitions[i]
    if (staticDefinition.address.toHexString() == tokenAddressHex) {
      return staticDefinition
    }
  }

  // If not found, return null
  return null
}

export const STATIC_TOKEN_DEFINITIONS: Array<StaticTokenDefinition> = [
  {
    address: Address.fromString('0x82af49447d8a07e3bd95bd0d56f35241523fbab1'),
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: BigInt.fromI32(18)
  }
]
