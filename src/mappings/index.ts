import { handleInitialize as handleInitializeHelper } from './core/initialize'
import { handleMint as handleMintHelper } from './core/mint'
import { handleBurn as handleBurnHelper } from './core/burn'
import { handleSwap as handleSwapHelper } from './core/swap'
import { handleCollect as handleCollectHelper } from './core/collect'
import { handleFlash as handleFlashHelper } from './core/flash'
import { Initialize, Mint, Burn, Swap, Flash } from '../../generated/templates/Pool/Pool'
import { Collect } from '../../generated/NonfungiblePositionManager/NonfungiblePositionManager'

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
