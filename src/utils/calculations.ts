import type { DuctItem, Material } from '../types'
import {
  RECT_THICKNESS_TABLE,
  ROUND_THICKNESS_TABLE,
  MATERIAL_DENSITY,
} from './constants'

/** Auto sheet thickness by DIN 24153 */
export function getAutoThickness(item: DuctItem): number {
  if (item.shape === 'rectangular') {
    const maxSide = Math.max(item.a || 0, item.b || 0)
    const row = RECT_THICKNESS_TABLE.find((r) => maxSide <= r.maxSide)
    return row ? row.thickness : 1.5
  } else {
    const d = item.d || 0
    const row = ROUND_THICKNESS_TABLE.find((r) => d <= r.maxD)
    return row ? row.thickness : 1.25
  }
}

/** Surface area in m² for a single item (before multiplying by length/quantity) */
function surfacePerUnit(item: DuctItem): number {
  const a = (item.a || 0) / 1000  // mm → m
  const b = (item.b || 0) / 1000
  const d = (item.d || 0) / 1000
  const a2 = (item.a2 || 0) / 1000
  const b2 = (item.b2 || 0) / 1000
  const d2 = (item.d2 || 0) / 1000
  const angle = item.angle || 90

  switch (item.type) {
    case 'duct': {
      // Surface per 1 meter of length
      if (item.shape === 'rectangular') return 2 * (a + b)
      else return Math.PI * d
    }

    case 'elbow90':
    case 'elbow45':
    case 'elbow_custom': {
      const theta =
        item.type === 'elbow90'
          ? Math.PI / 2
          : item.type === 'elbow45'
          ? Math.PI / 4
          : (angle * Math.PI) / 180

      if (item.shape === 'rectangular') {
        // R_inner = a (width of duct)
        const R = a
        // Two curved plates (outer + inner): θ*(R+a+R)*b = θ*(2R+a)*b
        const curved = theta * (2 * R + a) * b
        // Two flat cheeks (quarter-annuli): 2 * (theta/(2pi)) * pi * ((R+a)^2 - R^2)
        const cheeks = theta * a * (2 * R + a)
        return curved + cheeks
      } else {
        // Round elbow: R_centerline = 1.5*d
        const Rc = 1.5 * d
        return Math.PI * d * theta * Rc
      }
    }

    case 'reducer': {
      if (item.shape === 'rectangular') {
        // Length of reducer cone (assume 45° slope → L = max((a-a2)/2, (b-b2)/2))
        const L = Math.max(Math.abs(a - a2) / 2, Math.abs(b - b2) / 2) + 0.15 // min 150mm
        // Faces of width a→a2 slope by the change of b, faces of width b→b2 by the change of a
        const h1 = Math.sqrt(L * L + ((b - b2) / 2) ** 2)
        const h2 = Math.sqrt(L * L + ((a - a2) / 2) ** 2)
        return (a + a2) * h1 + (b + b2) * h2
      } else {
        // Conical reducer
        const L = Math.abs(d - d2) / 2 + 0.15
        const slant = Math.sqrt(L * L + ((d - d2) / 2) ** 2)
        return Math.PI * (d + d2) / 2 * slant
      }
    }

    case 'tpiece': {
      if (item.shape === 'rectangular') {
        // Main duct stub (half perimeter * branch height) + branch stub
        // Simplified: main half + branch opening + branch duct stub
        const branchH = b2 || b
        const branchW = a2 || a
        return (2 * (a + b) * (branchH / 2)) + (2 * (branchW + branchH) * branchW * 0.5)
      } else {
        const dBranch = d2 || d
        return Math.PI * d * dBranch * 0.5 + Math.PI * dBranch * dBranch * 0.5
      }
    }

    case 'endcap': {
      if (item.shape === 'rectangular') {
        return a * b
      } else {
        return Math.PI * (d / 2) ** 2
      }
    }

    case 'custom':
    default:
      return 0
  }
}

/** Calculate surface area in m² */
export function calcSurfaceArea(item: DuctItem): number {
  // Custom items: total surface is entered by the user
  if (item.type === 'custom') return item.surfaceManual || 0
  const perUnit = surfacePerUnit(item)
  // For ducts: multiply by length (m); for fittings: multiply by quantity (pieces)
  return perUnit * (item.length || 0)
}

/** Resolve final thickness (mm) */
export function resolveThickness(item: DuctItem): number {
  if (item.thicknessMode === 'manual') return item.thicknessManual || 0
  return getAutoThickness(item)
}

/** Calculate mass in kg */
export function calcMass(surfaceArea: number, thicknessMm: number, material: Material): number {
  const thicknessM = thicknessMm / 1000
  const density = MATERIAL_DENSITY[material]
  return surfaceArea * thicknessM * density
}

/** Fully calculate a DuctItem and return updated fields */
export function recalcItem(item: DuctItem): DuctItem {
  const thickness = resolveThickness(item)
  const surfaceArea = calcSurfaceArea(item)
  const mass = calcMass(surfaceArea, thickness, item.material)
  return { ...item, thickness, surfaceArea, mass }
}
