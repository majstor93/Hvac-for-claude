import type { DuctItem } from '../types'
import { ITEM_TYPE_LABELS, MATERIAL_LABELS } from '../types'
import { recalcItem } from './calculations'

const NUMERIC_KEYS = [
  'a', 'b', 'd', 'a2', 'b2', 'd2', 'angle', 'length', 'thicknessManual', 'surfaceManual',
] as const

function hasKey(obj: object, key: unknown): boolean {
  return typeof key === 'string' && Object.hasOwn(obj, key)
}

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

/**
 * Fill missing fields of a stored or imported item, replace invalid values
 * with defaults and recalculate it
 */
export function normalizeItem(raw: Partial<DuctItem>): DuctItem {
  const base = createEmpty()
  const item = { ...base, ...raw }
  // Older saves kept the manual area of custom items in surfaceArea
  if (raw.surfaceManual === undefined && item.type === 'custom') {
    item.surfaceManual = raw.surfaceArea || 0
  }
  for (const key of NUMERIC_KEYS) {
    const v = Number(item[key])
    item[key] = Number.isFinite(v) && v >= 0 ? v : base[key]
  }
  if (!hasKey(ITEM_TYPE_LABELS, item.type)) item.type = base.type
  if (!hasKey(MATERIAL_LABELS, item.material)) item.material = base.material
  if (item.shape !== 'round') item.shape = 'rectangular'
  if (item.thicknessMode !== 'manual') item.thicknessMode = 'auto'
  if (typeof item.name !== 'string') item.name = ''
  if (typeof item.id !== 'string' || !item.id) item.id = base.id
  return recalcItem(item)
}
