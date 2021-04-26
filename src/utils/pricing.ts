import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export function calculatePrice(sqrtPrice: BigInt): BigDecimal[] {
  const numerator = BigDecimal.fromString(sqrtPrice.times(sqrtPrice).toString())
  const denominator = BigInt.fromI32(2)
    .pow(256)
    .toBigDecimal()
  const price0 = numerator.div(denominator)
  const price1 = denominator.div(numerator)
  return [price0, price1]
}
