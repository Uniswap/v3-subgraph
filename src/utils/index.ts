/* eslint-disable prefer-const */
import { BigInt, BigDecimal, ethereum, ByteArray, Bytes } from '@graphprotocol/graph-ts'
import { Transaction } from '../types/schema'
import { ONE_BI, ZERO_BI, ZERO_BD, ONE_BD } from '../utils/constants'

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD
  } else {
    return amount0.div(amount1)
  }
}

export function safeDivBigInt(amount0: BigInt, amount1: BigInt): BigInt {
  if (amount1.equals(ZERO_BI)) {
    return ZERO_BI
  } else {
    return amount0.div(amount1)
  }
}

export function ticktoPrice(tickBase: BigDecimal, tickIdx: BigInt, numerator: BigInt, denominator: BigInt): BigDecimal {
  if (tickIdx.equals(ZERO_BI)) {
    return ONE_BD
  }
  let negativePower = tickIdx.lt(ZERO_BI)
  let result = ZERO_BD.plus(tickBase)
  let powerAbs = tickIdx.abs()
  for (let i = ONE_BI; i.lt(powerAbs); i = i.plus(ONE_BI)) {
    result = result.times(tickBase)
  }

  if (negativePower) {
    result = safeDiv(ONE_BD, result)
  }

  let scalar = numerator.minus(denominator);
  let TEN_BI = BigDecimal.fromString('10');

  if (scalar.gt(ZERO_BI)) {
    for (let i = ZERO_BI; i.lt(scalar); i = i.plus(ONE_BI)) {
      result = result.times(TEN_BI)
    }
  } else {
    // Scalar is negative, so invert it
    scalar = scalar.abs()

    for (let i = ZERO_BI; i.lt(scalar); i = i.plus(ONE_BI)) {
      result = safeDiv(result, TEN_BI)
    }
  }

  return result
}

export function tokenAmountToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

export function priceToDecimal(amount: BigDecimal, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return amount
  }
  return safeDiv(amount, exponentToBigDecimal(exchangeDecimals))
}

export function equalToZero(value: BigDecimal): boolean {
  const formattedVal = parseFloat(value.toString())
  const zero = parseFloat(ZERO_BD.toString())
  if (zero == formattedVal) {
    return true
  }
  return false
}

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}

export function bigDecimalExp18(): BigDecimal {
  return BigDecimal.fromString('1000000000000000000')
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}

export function convertEthToDecimal(eth: BigInt): BigDecimal {
  return eth.toBigDecimal().div(exponentToBigDecimal(18))
}

export function loadTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
  }
  transaction.blockNumber = event.block.number
  transaction.timestamp = event.block.timestamp
  transaction.gasUsed = event.transaction.gasUsed
  transaction.gasPrice = event.transaction.gasPrice
  transaction.save()
  return transaction as Transaction
}

function hexToBigInt(hex: string): BigInt {
  return BigInt.fromUnsignedBytes(Bytes.fromHexString(hex) as Bytes)
}

export function getSqrtRatioAtTick(tick: i32): BigInt {
  let MaxUint256 = hexToBigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
  let absTick = BigInt.fromI32(tick).abs().toI32()
  let Q32 = BigInt.fromI32(2).pow(32)

  let ratio =
    (absTick & 0x1) != 0
      ? hexToBigInt('0xfffcb933bd6fad37aa2d162d1a594001')
      : hexToBigInt('0x0100000000000000000000000000000000')
  if ((absTick & 0x2) != 0) ratio = ratio.times(hexToBigInt('0xfff97272373d413259a46990580e213a')).rightShift(128)
  if ((absTick & 0x4) != 0) ratio = ratio.times(hexToBigInt('0xfff2e50f5f656932ef12357cf3c7fdcc')).rightShift(128)
  if ((absTick & 0x8) != 0) ratio = ratio.times(hexToBigInt('0xffe5caca7e10e4e61c3624eaa0941cd0')).rightShift(128)
  if ((absTick & 0x10) != 0) ratio = ratio.times(hexToBigInt('0xffcb9843d60f6159c9db58835c926644')).rightShift(128)
  if ((absTick & 0x20) != 0) ratio = ratio.times(hexToBigInt('0xff973b41fa98c081472e6896dfb254c0')).rightShift(128)
  if ((absTick & 0x40) != 0) ratio = ratio.times(hexToBigInt('0xff2ea16466c96a3843ec78b326b52861')).rightShift(128)
  if ((absTick & 0x80) != 0) ratio = ratio.times(hexToBigInt('0xfe5dee046a99a2a811c461f1969c3053')).rightShift(128)
  if ((absTick & 0x100) != 0) ratio = ratio.times(hexToBigInt('0xfcbe86c7900a88aedcffc83b479aa3a4')).rightShift(128)
  if ((absTick & 0x200) != 0) ratio = ratio.times(hexToBigInt('0xf987a7253ac413176f2b074cf7815e54')).rightShift(128)
  if ((absTick & 0x400) != 0) ratio = ratio.times(hexToBigInt('0xf3392b0822b70005940c7a398e4b70f3')).rightShift(128)
  if ((absTick & 0x800) != 0) ratio = ratio.times(hexToBigInt('0xe7159475a2c29b7443b29c7fa6e889d9')).rightShift(128)
  if ((absTick & 0x1000) != 0) ratio = ratio.times(hexToBigInt('0xd097f3bdfd2022b8845ad8f792aa5825')).rightShift(128)
  if ((absTick & 0x2000) != 0) ratio = ratio.times(hexToBigInt('0xa9f746462d870fdf8a65dc1f90e061e5')).rightShift(128)
  if ((absTick & 0x4000) != 0) ratio = ratio.times(hexToBigInt('0x70d869a156d2a1b890bb3df62baf32f7')).rightShift(128)
  if ((absTick & 0x8000) != 0) ratio = ratio.times(hexToBigInt('0x31be135f97d08fd981231505542fcfa6')).rightShift(128)
  if ((absTick & 0x10000) != 0) ratio = ratio.times(hexToBigInt('0x09aa508b5b7a84e1c677de54f3e99bc9')).rightShift(128)
  if ((absTick & 0x20000) != 0) ratio = ratio.times(hexToBigInt('0x5d6af8dedb81196699c329225ee604')).rightShift(128)
  if ((absTick & 0x40000) != 0) ratio = ratio.times(hexToBigInt('0x2216e584f5fa1ea926041bedfe98')).rightShift(128)
  if ((absTick & 0x80000) != 0) ratio = ratio.times(hexToBigInt('0x048a170391f7dc42444e8fa2')).rightShift(128)

  if (tick > 0) ratio = MaxUint256.div(ratio)

  // back to Q96
  return ratio.div(Q32).gt(ZERO_BI)
    ? ratio.div(Q32).plus(ONE_BI)
    : ratio.div(Q32)
}