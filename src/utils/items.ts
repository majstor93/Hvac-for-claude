import type { DuctItem } from '../types'
import { recalcItem } from './calculations'

export function createEmpty(): DuctItem {
  return {
    id: crypto.randomUUID(),
    name: '',
    type: 'duct',
    shape: 'rectangular',
    a: 0, b: 0, d: 0,
    a2: 0, b2: 0, d2: 0,
    angle: 90,
    length: 0,
    material: 'galvanized',
    thicknessMode: 'auto',
    thicknessManual: 0.6,
    surfaceManual: 0,
    surfaceArea: 0,
    thickness: 0.6,
    mass: 0,
  }
}

/** Fill missing fields of a stored item and recalculate it */
export function normalizeItem(raw: Partial<DuctItem>): DuctItem {
  const item = { ...createEmpty(), ...raw }
  // Older saves kept the manual area of custom items in surfaceArea
  if (raw.surfaceManual === undefined && item.type === 'custom') {
    item.surfaceManual = raw.surfaceArea || 0
  }
  return recalcItem(item)
}
