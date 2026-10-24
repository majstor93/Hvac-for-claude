import type { Material } from '../types'

// Orientation sheet thickness (mm), common practice for low-pressure ducts.
// Current EN 1505/1506 (dimensions) and EN 1507/12237 (strength, leakage)
// do not tabulate a fixed thickness; check project or fabricator requirements.
// Rectangular: based on longest side (mm)
export const RECT_THICKNESS_TABLE: Array<{ maxSide: number; thickness: number }> = [
  { maxSide: 400, thickness: 0.6 },
  { maxSide: 800, thickness: 0.8 },
  { maxSide: 1250, thickness: 1.0 },
  { maxSide: 2000, thickness: 1.25 },
  { maxSide: Infinity, thickness: 1.5 },
]

// Round: based on diameter (mm)
export const ROUND_THICKNESS_TABLE: Array<{ maxD: number; thickness: number }> = [
  { maxD: 315, thickness: 0.6 },
  { maxD: 630, thickness: 0.8 },
  { maxD: 1000, thickness: 1.0 },
  { maxD: Infinity, thickness: 1.25 },
]

// Material density (kg/m³)
export const MATERIAL_DENSITY: Record<Material, number> = {
  galvanized: 7850,
  stainless: 7900,
  aluminum: 2700,
}

// T-piece: main duct runs 100 mm past the branch on each side (m)
export const TEE_COLLAR = 0.1
// T-piece: length of the branch stub from the main duct wall (m)
export const TEE_BRANCH_LENGTH = 0.15

// Standard bend radius for elbows: inner radius = largest duct dimension
export const ELBOW_INNER_RADIUS_FACTOR = 1.0 // R_inner = a * factor
