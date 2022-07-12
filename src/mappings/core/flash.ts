/* eslint-disable prefer-const */
import { Pool } from '../../types/schema'
import { Flash as FlashEvent } from '../../types/templates/Pool/Pool'

export function handleFlash(event: FlashEvent): void {
  //@TODO: Fill this in and create Flash events.
  let pool = Pool.load(event.address.toHexString())
  pool.save()
}
