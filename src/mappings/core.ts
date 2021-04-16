import { Swap, Mint as PoolMint, Burn as PoolBurn } from '../types/templates/Pool/Pool'
import { log } from '@graphprotocol/graph-ts'

export function handleSwap(event: Swap): void {
  log.debug('testing it: {}', [event.params.amount0.toString()])
}

export function handlePoolMint(event: PoolMint): void {
}

export function handlePoolBurn(event: PoolBurn): void {
s}
