import { Swap } from '../types/templates/Pair/Pair'
import { log } from '@graphprotocol/graph-ts'

export function handleSwap(event: Swap): void {
  log.debug('testing it: {}', [event.params.amount0.toString()])
}
