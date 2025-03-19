import { BigInt } from '@graphprotocol/graph-ts'

export function hexToBigint(hex: string): BigInt {
  let bigint = BigInt.fromI32(0)
  let power = BigInt.fromI32(1)
  for (let i = hex.length - 1; i >= 0; i--) {
    const char = hex.charCodeAt(i)
    let value = 0
    if (char >= 48 && char <= 57) {
      value = char - 48
    } else if (char >= 65 && char <= 70) {
      value = char - 55
    }
    bigint = bigint.plus(BigInt.fromI32(value).times(power))
    power = power.times(BigInt.fromI32(16))
  }
  return bigint
}
