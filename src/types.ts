export type DuctShape = 'rectangular' | 'round'

export type ItemType =
  | 'duct'
  | 'elbow90'
  | 'elbow45'
  | 'elbow_custom'
  | 'reducer'
  | 'tpiece'
  | 'endcap'
  | 'custom'

export type Material = 'galvanized' | 'stainless' | 'aluminum'

export interface DuctItem {
  id: string
  name: string
  type: ItemType
  shape: DuctShape
  // Rectangular dimensions (mm)
  a: number
  b: number
  // Round dimension (mm)
  d: number
  // Secondary dimensions for reducer / T-piece
  a2: number
  b2: number
  d2: number
  // Elbow custom angle (degrees)
  angle: number
  // Quantity or length
  length: number        // meters for duct, pieces for fittings
  isCount: boolean      // true = pieces, false = meters
  // Material
  material: Material
  // Sheet thickness
  thicknessMode: 'auto' | 'manual'
  thicknessManual: number // mm
  // Calculated (readonly)
  surfaceArea: number   // m²
  thickness: number     // mm (resolved)
  mass: number          // kg
}

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  duct: 'Kanal',
  elbow90: 'Koljeno 90°',
  elbow45: 'Koljeno 45°',
  elbow_custom: 'Koljeno kut.',
  reducer: 'Redukcija',
  tpiece: 'T-komad',
  endcap: 'Čep',
  custom: 'Prilagođeno',
}

export const MATERIAL_LABELS: Record<Material, string> = {
  galvanized: 'Pocinčani čelik',
  stainless: 'Nehrđajući čelik',
  aluminum: 'Aluminij',
}
