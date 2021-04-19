import { 
    Bundle,
    Pool,
    Token,
    Transaction,
    Factory,
    Mint as MintEvent,
    Burn as BurnEvent,
    Swap as SwapEvent
} from '../types/schema'
import { log, store, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

import { 
    Pool as PoolContract,
    Swap, 
    Mint as PoolMint, 
    Burn as PoolBurn, 
    Initialize,
    Transfer
} from '../types/templates/Pool/Pool'

import { 
    convertTokenToDecimal, 
    ONE_BI, 
    FACTORY_ADDRESS,
    ADDRESS_ZERO,
    BI_18
} from './helpers';
import { ZERO_BI } from '../utils/constants';

function isCompleteMint(mintId: string): boolean {
    return MintEvent.load(mintId).sender !== null // sufficient checks
}

export function handleTransfer(event: Transfer): void {
    // ignore initial transfers for first adds
    if (event.params.to.toHexString() == ADDRESS_ZERO && event.params.value.equals(BigInt.fromI32(1000))) {
        return
    }

    let factory = Factory.load(FACTORY_ADDRESS)
    let transactionHash = event.transaction.hash.toHexString()

    // user stats
    let from = event.params.from
    // createUser(from)
    let to = event.params.to
    // createUser(to)

    // get pair and load contract
    let pool = Pool.load(event.address.toHexString())
    let poolContract = PoolContract.bind(event.address)

    // liquidity token amount being transfered
    let value = convertTokenToDecimal(event.params.value, BI_18)

    // get or create transaction
    let transaction = Transaction.load(transactionHash)
    if (transaction === null) {
        transaction = new Transaction(transactionHash)
        transaction.blockNumber = event.block.number
        transaction.timestamp = event.block.timestamp
        transaction.mints = []
        transaction.burns = []
        transaction.swaps = []
    }

    // mints
    let mints = transaction.mints
    if (from.toHexString() == ADDRESS_ZERO) {
        // create new mint if no mints so far or if last one is done already
        if (mints.length === 0 || isCompleteMint(mints[mints.length - 1])) {
            let mint = new MintEvent(
                event.transaction.hash
                    .toHexString()
                    .concat('-')
                    .concat(BigInt.fromI32(mints.length).toString())
            )
            mint.transaction = transaction.id
            mint.pool = pool.id
            mint.to = to

            // TODO: Figure out if this is correct
            mint.liquidity = ZERO_BI
            mint.timestamp = transaction.timestamp
            mint.transaction = transaction.id
            mint.save()

            // update mints in transaction
            transaction.mints = mints.concat([mint.id])

            // save entities
            transaction.save()
            factory.save()
        }
    }

    // case where direct send first on ETH withdrawls
    if (event.params.to.toHexString() == pool.id) {
        let burns = transaction.burns
        let burn = new BurnEvent(
            event.transaction.hash
                .toHexString()
                .concat('-')
                .concat(BigInt.fromI32(burns.length).toString())
        )
        burn.transaction = transaction.id
        burn.pool = pool.id

        // TODO: Figure out if this is correct
        burn.liquidity = ZERO_BI

        burn.timestamp = transaction.timestamp
        burn.to = event.params.to
        burn.sender = event.params.from
        burn.needsComplete = true
        burn.transaction = transaction.id
        burn.save()

        // TODO: Consider using .concat() for handling array updates to protect
        // against unintended side effects for other code paths.
        burns.push(burn.id)
        transaction.burns = burns
        transaction.save()
    }

    // burn
    if (event.params.to.toHexString() == ADDRESS_ZERO && event.params.from.toHexString() == pool.id) {
        // this is a new instance of a logical burn
        let burns = transaction.burns
        let burn: BurnEvent
        if (burns.length > 0) {
            let currentBurn = BurnEvent.load(burns[burns.length - 1])
            if (currentBurn.needsComplete) {
                burn = currentBurn as BurnEvent
            } else {
                burn = new BurnEvent(
                    event.transaction.hash
                        .toHexString()
                        .concat('-')
                        .concat(BigInt.fromI32(burns.length).toString())
                )
                burn.transaction = transaction.id
                burn.needsComplete = false
                burn.pool = pool.id
                // TODO: Figure out if this is correct
                burn.liquidity = ZERO_BI
                burn.transaction = transaction.id
                burn.timestamp = transaction.timestamp
            }
        } else {
            burn = new BurnEvent(
                event.transaction.hash
                    .toHexString()
                    .concat('-')
                    .concat(BigInt.fromI32(burns.length).toString())
            )
            burn.transaction = transaction.id
            burn.needsComplete = false
            burn.pool = pool.id
            // TODO: Figure out if this is correct
            burn.liquidity = ZERO_BI
            burn.transaction = transaction.id
            burn.timestamp = transaction.timestamp
        }

        // if this logical burn included a fee mint, account for this
        if (mints.length !== 0 && !isCompleteMint(mints[mints.length - 1])) {
            let mint = MintEvent.load(mints[mints.length - 1])
            burn.feeTo = mint.to
            // burn.feeLiquidity = mint.liquidity
            // remove the logical mint
            store.remove('Mint', mints[mints.length - 1])
            // update the transaction

            // TODO: Consider using .slice().pop() to protect against unintended
            // side effects for other code paths.
            mints.pop()
            transaction.mints = mints
            transaction.save()
        }
        burn.save()
        // if accessing last one, replace it
        if (burn.needsComplete) {
            // TODO: Consider using .slice(0, -1).concat() to protect against
            // unintended side effects for other code paths.
            burns[burns.length - 1] = burn.id
        }
        // else add new one
        else {
            // TODO: Consider using .concat() for handling array updates to protect
            // against unintended side effects for other code paths.
            burns.push(burn.id)
        }
        transaction.burns = burns
        transaction.save()
    }

    // if (from.toHexString() != ADDRESS_ZERO && from.toHexString() != pair.id) {
    //     let fromUserLiquidityPosition = createLiquidityPosition(event.address, from)
    //     fromUserLiquidityPosition.liquidityTokenBalance = convertTokenToDecimal(pairContract.balanceOf(from), BI_18)
    //     fromUserLiquidityPosition.save()
    //     createLiquiditySnapshot(fromUserLiquidityPosition, event)
    // }

    // if (event.params.to.toHexString() != ADDRESS_ZERO && to.toHexString() != pair.id) {
    //     let toUserLiquidityPosition = createLiquidityPosition(event.address, to)
    //     toUserLiquidityPosition.liquidityTokenBalance = convertTokenToDecimal(pairContract.balanceOf(to), BI_18)
    //     toUserLiquidityPosition.save()
    //     createLiquiditySnapshot(toUserLiquidityPosition, event)
    // }

    transaction.save()
}

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
    pool.currentTick = BigInt.fromI32(event.params.tick);
    pool.save();
}


export function handlePoolMint(event: PoolMint): void {
    log.info(`Saw a pool mint! {}`, [event.block.number.toString()]);
    
    let transaction = Transaction.load(event.transaction.hash.toHexString())
    let mints = transaction.mints
    log.info(`This is mints! {}`, [JSON.stringify(mints)]);
    let mint = MintEvent.load(mints[mints.length - 1])

    let pool = Pool.load(event.address.toHexString())
    let uniswap = Factory.load(FACTORY_ADDRESS)

    let token0 = Token.load(pool.token0)
    let token1 = Token.load(pool.token1)
    let amount0 = convertTokenToDecimal(event.params.amount0, token0.decimals)
    let amount1 = convertTokenToDecimal(event.params.amount1, token1.decimals)    

    // update txn counts
    token0.txCount = token0.txCount.plus(ONE_BI)
    token1.txCount = token1.txCount.plus(ONE_BI)

    pool.liquidity = pool.liquidity.plus(event.params.amount);
    pool.reserve0 = pool.reserve0.plus(amount0);
    pool.reserve1 = pool.reserve1.plus(amount1);

    token0.save()
    token1.save()
    pool.save()
    uniswap.save()
    // Calculate new reserveUSD
    // Calculate amount of liquidity to distribute to each tick

    // Create mint entity
    mint.sender = event.params.sender
    mint.tickLower = BigInt.fromI32(event.params.tickLower)
    mint.tickUpper = BigInt.fromI32(event.params.tickUpper)
    mint.amount0 = amount0 as BigDecimal
    mint.amount1 = amount1 as BigDecimal
    mint.logIndex = event.logIndex
    // mint.amountUSD = amountTotalUSD as BigDecimal
    mint.save()

    // Update hourly and daily datas
}

export function handlePoolBurn(event: PoolBurn): void {
    log.info(`Saw a pool burn! {}`, [event.block.number.toString()]);
}
