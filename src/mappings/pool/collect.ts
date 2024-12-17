import { Pool, Token } from '../../types/schema'
import { Collect as CollectEvent } from '../../types/templates/Pool/Pool'

export function handleCollect(event: CollectEvent): void {
  handleCollectHelper(event)
}

export function handleCollectHelper(event: CollectEvent): void {
  const pool = Pool.load(event.address.toHexString())
  if (pool == null) {
    return
  }

  const token0 = Token.load(pool.token0)
  const token1 = Token.load(pool.token1)
  if (token0 == null || token1 == null) {
    return
  }

  token0.save()
  token1.save()
  pool.save()

  return
}
