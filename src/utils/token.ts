import { Address, BigInt } from '@graphprotocol/graph-ts'

import { ERC20 } from '../types/Factory/ERC20'
import { ERC20NameBytes } from '../types/Factory/ERC20NameBytes'
import { ERC20SymbolBytes } from '../types/Factory/ERC20SymbolBytes'
import { isNullEthValue } from '.'
import { getStaticDefinition, STATIC_TOKEN_DEFINITIONS, StaticTokenDefinition } from './staticTokenDefinition'

export function fetchTokenSymbol(
  tokenAddress: Address,
  staticTokenDefinitions: StaticTokenDefinition[] = STATIC_TOKEN_DEFINITIONS,
): string {
  const contract = ERC20.bind(tokenAddress)
  const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress)

  // try with the static definition
  const staticTokenDefinition = getStaticDefinition(tokenAddress, staticTokenDefinitions)
  if (staticTokenDefinition != null) {
    return staticTokenDefinition.symbol
  }

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  const symbolResult = contract.try_symbol()
  if (symbolResult.reverted) {
    const symbolResultBytes = contractSymbolBytes.try_symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export function fetchTokenName(
  tokenAddress: Address,
  staticTokenDefinitions: StaticTokenDefinition[] = STATIC_TOKEN_DEFINITIONS,
): string {
  const contract = ERC20.bind(tokenAddress)
  const contractNameBytes = ERC20NameBytes.bind(tokenAddress)

  // try with the static definition
  const staticTokenDefinition = getStaticDefinition(tokenAddress, staticTokenDefinitions)
  if (staticTokenDefinition != null) {
    return staticTokenDefinition.name
  }

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  const nameResult = contract.try_name()
  if (nameResult.reverted) {
    const nameResultBytes = contractNameBytes.try_name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  const contract = ERC20.bind(tokenAddress)
  let totalSupplyValue = BigInt.zero()
  const totalSupplyResult = contract.try_totalSupply()
  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult.value
  }
  return totalSupplyValue
}

export function fetchTokenDecimals(
  tokenAddress: Address,
  staticTokenDefinitions: StaticTokenDefinition[] = STATIC_TOKEN_DEFINITIONS,
): BigInt | null {
  // try with the static definition
  const staticTokenDefinition = getStaticDefinition(tokenAddress, staticTokenDefinitions)
  if (staticTokenDefinition) {
    return staticTokenDefinition.decimals
  }

  const contract = ERC20.bind(tokenAddress)
  // try types uint8 for decimals
  const decimalResult = contract.try_decimals()

  if (!decimalResult.reverted) {
    if (decimalResult.value.lt(BigInt.fromI32(255))) {
      return decimalResult.value
    }
  }

  return null
}
