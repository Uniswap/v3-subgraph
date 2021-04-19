import { Bundle, Pool, Token } from '../types/schema'
import { log, BigDecimal } from '@graphprotocol/graph-ts'

import { Swap, Mint as PoolMint, Burn as PoolBurn, Initialize } from '../types/templates/Pool/Pool'

import { convertTokenToDecimal } from './helpers';

export function handleSwap(event: Swap): void {
    // let pool = Pool.load(event.address.toHexString())
    // let token0 = Token.load(pool.token0)
    // let token1 = Token.load(pool.token1)
    // let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
    // let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)    

    // // No more sync event, so need additional logic for updating bundle here if pool is part of bundle
    // // ETH/USD prices
    // let bundle = Bundle.load('1')

    // // get total amounts of derived USD and ETH for tracking
    // let derivedAmountETH = (token1.derivedETH.times(amount1))
    //     .plus(token0.derivedETH.times(amount0))
    //     .div(BigDecimal.fromString('2'))
    // let derivedAmountUSD = derivedAmountETH.times(bundle.ethPrice)

    // let trackedAmountETH: BigDecimal
    // let trackedAmountUSD: BigDecimal

    // if (bundle.ethPrice.equals(ZERO_BD)) {

    // }

    // let trackedAmountUSD = getTrackedVolumeUSD(amount0Total, token0 as Token, amount1Total, token1 as Token, pair as Pair)

    // let trackedAmountETH: BigDecimal
    // if (bundle.ethPrice.equals(ZERO_BD)) {
    //     trackedAmountETH = ZERO_BD
    // } else {
    //     trackedAmountETH = trackedAmountUSD.div(bundle.ethPrice)
    // }
}

export function handleInitialize(event: Initialize): void {
    log.info(`Saw a pool initialize! {}`, [event.block.number.toString()]);

    let pool = Pool.load(event.address.toHexString());
    pool.sqrtPrice = event.params.sqrtPriceX96;

}


export function handlePoolMint(event: PoolMint): void {
    log.info(`Saw a pool mint! {}`, [event.block.number.toString()]);
}

export function handlePoolBurn(event: PoolBurn): void {
    log.info(`Saw a pool burn! {}`, [event.block.number.toString()]);
}
