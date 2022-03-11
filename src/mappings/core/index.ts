import { handleInitialize as handleInitializeHelper } from './initialize'
import { handleMint as handleMintHelper } from './mint'
import { handleBurn as handleBurnHelper } from './burn'
import { handleSwap as handleSwapHelper } from './swap'
import { handleCollect as handleCollectHelper } from './collect'
import { handleFlash as handleFlashHelper } from './flash'
import { Initialize, Mint, Burn, Swap, Collect, Flash } from '../../types/templates/Pool/Pool'

// Workaround for limited export types in Assemblyscript.
export function handleInitialize(event: Initialize): void {
  handleInitializeHelper(event)
}
export function handleMint(event: Mint): void {
  handleMintHelper(event)
}
export function handleBurn(event: Burn): void {
  handleBurnHelper(event)
}
export function handleSwap(event: Swap): void {
  handleSwapHelper(event)
}
export function handleCollect(event: Collect): void {
  handleCollectHelper(event)
}
export function handleFlash(event: Flash): void {
  handleFlashHelper(event)
}
