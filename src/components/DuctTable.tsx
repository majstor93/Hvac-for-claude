import type { DuctItem, ItemType, DuctShape, Material } from '../types'
import { ITEM_TYPE_LABELS, MATERIAL_LABELS } from '../types'
import { recalcItem } from '../utils/calculations'
import { createEmpty } from '../utils/items'

interface Props {
  items: DuctItem[]
  onChange: (items: DuctItem[]) => void
}

function needsSecondDim(type: ItemType) {
  return type === 'reducer' || type === 'tpiece'
}

function isAngleType(type: ItemType) {
  return type === 'elbow_custom'
}

function isFitting(type: ItemType) {
  return type !== 'duct' && type !== 'custom'
}

function Cell({
  value,
  onChange,
  className = '',
  type = 'text',
  min,
  step,
  placeholder,
  disabled,
}: {
  value: string | number
  onChange: (v: string) => void
  className?: string
  type?: string
  min?: number
  step?: number
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-7 px-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-blue-50 rounded disabled:bg-gray-100 disabled:text-gray-400 ${className}`}
    />
  )
}

function SelectCell<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; label: string }>
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full h-7 px-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-blue-50 rounded"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export default function DuctTable({ items, onChange }: Props) {
  function update(id: string, patch: Partial<DuctItem>) {
    const updated = items.map((item) => {
      if (item.id !== id) return item
      return recalcItem({ ...item, ...patch })
    })
    onChange(updated)
  }

  function addRow() {
    onChange([...items, recalcItem(createEmpty())])
  }

  function duplicateLast() {
    if (items.length === 0) {
      onChange([recalcItem(createEmpty())])
      return
    }
    const last = items[items.length - 1]
    const clone = recalcItem({
      ...last,
      id: crypto.randomUUID(),
      name: last.name ? last.name + ' (kopija)' : '',
      length: 0,
      surfaceArea: 0,
      mass: 0,
    })
    onChange([...items, clone])
  }

  function removeRow(id: string) {
    onChange(items.filter((i) => i.id !== id))
  }

  function moveRow(id: string, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === id)
    if (idx < 0) return
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= items.length) return
    const arr = [...items]
    ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
    onChange(arr)
  }

  function num(v: string): number {
    const n = parseFloat(v)
    return isNaN(n) ? 0 : n
  }

  const itemTypeOptions = Object.entries(ITEM_TYPE_LABELS).map(([v, l]) => ({
    value: v as ItemType,
    label: l,
  }))
  const shapeOptions = [
    { value: 'rectangular' as DuctShape, label: 'Pravokutni' },
    { value: 'round' as DuctShape, label: 'Okrugli' },
  ]
  const materialOptions = Object.entries(MATERIAL_LABELS).map(([v, l]) => ({
    value: v as Material,
    label: l,
  }))
  const thicknessOptions = [
    { value: 'auto' as const, label: 'Auto (DIN)' },
    { value: 'manual' as const, label: 'Ručno' },
  ]

  const td = 'border border-gray-200 px-0.5 py-0'
  const totalSurface = items.reduce((s, i) => s + i.surfaceArea, 0)
  const totalMass = items.reduce((s, i) => s + i.mass, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm" style={{ minWidth: 1240 }}>
        <thead>
          <tr className="bg-blue-700 text-white text-xs select-none">
            {[
              ['#', 'w-8'],
              ['Naziv / opis', 'w-36'],
              ['Tip elementa', 'w-28'],
              ['Oblik', 'w-24'],
              ['a (mm)', 'w-16'],
              ['b (mm)', 'w-16'],
              ['d (mm)', 'w-16'],
              ['a₂ (mm)', 'w-16'],
              ['b₂/d₂', 'w-16'],
              ['Kut °', 'w-14'],
              ['Duljina / kom', 'w-24'],
              ['Materijal', 'w-32'],
              ['Deb. lista', 'w-24'],
              ['δ (mm)', 'w-14'],
              ['Površ. (m²)', 'w-20'],
              ['Masa (kg)', 'w-20'],
              ['', 'w-16'],
            ].map(([label, cls]) => (
              <th
                key={label}
                className={`border border-blue-600 px-1 py-1.5 text-center ${cls}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td
                colSpan={17}
                className="text-center py-10 text-gray-400 italic border border-gray-200"
              >
                Nema unesenih stavki. Kliknite "+ Dodaj redak" za početak.
              </td>
            </tr>
          )}

          {items.map((item, idx) => {
            const isRect = item.shape === 'rectangular'
            const hasSecond = needsSecondDim(item.type)
            const hasAngle = isAngleType(item.type)
            const fitting = isFitting(item.type)
            const isCustom = item.type === 'custom'
            const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            const dash = <span className="text-gray-300 text-xs block text-center">—</span>

            return (
              <tr key={item.id} className={`${rowBg} hover:bg-yellow-50 transition-colors`}>
                <td className={`${td} text-center text-gray-400 text-xs w-8`}>{idx + 1}</td>

                <td className={td}>
                  <Cell
                    value={item.name}
                    onChange={(v) => update(item.id, { name: v })}
                    placeholder="opis..."
                  />
                </td>

                <td className={td}>
                  <SelectCell
                    value={item.type}
                    onChange={(v) => update(item.id, { type: v })}
                    options={itemTypeOptions}
                  />
                </td>

                <td className={td}>
                  <SelectCell
                    value={item.shape}
                    onChange={(v) => update(item.id, { shape: v })}
                    options={shapeOptions}
                  />
                </td>

                {/* a */}
                <td className={td}>
                  {isRect && !isCustom ? (
                    <Cell
                      type="number" min={0}
                      value={item.a || ''}
                      onChange={(v) => update(item.id, { a: num(v) })}
                      placeholder="200"
                    />
                  ) : dash}
                </td>

                {/* b */}
                <td className={td}>
                  {isRect && !isCustom ? (
                    <Cell
                      type="number" min={0}
                      value={item.b || ''}
                      onChange={(v) => update(item.id, { b: num(v) })}
                      placeholder="100"
                    />
                  ) : dash}
                </td>

                {/* d */}
                <td className={td}>
                  {!isRect && !isCustom ? (
                    <Cell
                      type="number" min={0}
                      value={item.d || ''}
                      onChange={(v) => update(item.id, { d: num(v) })}
                      placeholder="200"
                    />
                  ) : dash}
                </td>

                {/* a2 */}
                <td className={td}>
                  {hasSecond && isRect ? (
                    <Cell
                      type="number" min={0}
                      value={item.a2 || ''}
                      onChange={(v) => update(item.id, { a2: num(v) })}
                      placeholder="150"
                    />
                  ) : dash}
                </td>

                {/* b2 / d2 */}
                <td className={td}>
                  {hasSecond ? (
                    isRect ? (
                      <Cell
                        type="number" min={0}
                        value={item.b2 || ''}
                        onChange={(v) => update(item.id, { b2: num(v) })}
                        placeholder="80"
                      />
                    ) : (
                      <Cell
                        type="number" min={0}
                        value={item.d2 || ''}
                        onChange={(v) => update(item.id, { d2: num(v) })}
                        placeholder="150"
                      />
                    )
                  ) : dash}
                </td>

                {/* angle */}
                <td className={td}>
                  {hasAngle ? (
                    <Cell
                      type="number" min={1} step={1}
                      value={item.angle || ''}
                      onChange={(v) => update(item.id, { angle: num(v) })}
                      placeholder="90"
                    />
                  ) : dash}
                </td>

                {/* length (custom items take total surface instead) */}
                <td className={td}>
                  {isCustom ? dash : (
                  <div className="flex items-center">
                    <input
                      type="number" min={0} step={0.01}
                      value={item.length || ''}
                      placeholder={fitting ? 'kom' : 'm'}
                      onChange={(e) => update(item.id, { length: num(e.target.value) })}
                      className="w-14 h-7 px-1 text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-blue-50 rounded"
                    />
                    <span className="text-gray-400 text-xs ml-0.5">{fitting ? 'kom' : 'm'}</span>
                  </div>
                  )}
                </td>

                {/* material */}
                <td className={td}>
                  <SelectCell
                    value={item.material}
                    onChange={(v) => update(item.id, { material: v })}
                    options={materialOptions}
                  />
                </td>

                {/* thickness mode */}
                <td className={td}>
                  <SelectCell
                    value={item.thicknessMode}
                    onChange={(v) =>
                      update(item.id, { thicknessMode: v as 'auto' | 'manual' })
                    }
                    options={thicknessOptions}
                  />
                </td>

                {/* thickness value */}
                <td className={td}>
                  {item.thicknessMode === 'manual' ? (
                    <Cell
                      type="number" min={0} step={0.05}
                      value={item.thicknessManual || ''}
                      onChange={(v) => update(item.id, { thicknessManual: num(v) })}
                      placeholder="0.6"
                    />
                  ) : (
                    <span className="block text-center text-xs text-gray-600 px-1">
                      {item.thickness.toFixed(2)}
                    </span>
                  )}
                </td>

                {/* surface area */}
                <td className={td}>
                  {isCustom ? (
                    <Cell
                      type="number" min={0} step={0.01}
                      value={item.surfaceManual || ''}
                      onChange={(v) => update(item.id, { surfaceManual: num(v) })}
                      placeholder="m²"
                    />
                  ) : (
                    <span className="block text-center text-xs font-medium text-gray-700 px-1">
                      {item.surfaceArea > 0 ? item.surfaceArea.toFixed(3) : '—'}
                    </span>
                  )}
                </td>

                {/* mass */}
                <td className={td}>
                  <span className="block text-center text-sm font-semibold text-blue-800 px-1">
                    {item.mass > 0 ? item.mass.toFixed(2) : '—'}
                  </span>
                </td>

                {/* actions */}
                <td className={`${td} text-center`}>
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      onClick={() => moveRow(item.id, -1)}
                      disabled={idx === 0}
                      title="Gore"
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-20 px-0.5 text-xs"
                    >▲</button>
                    <button
                      onClick={() => moveRow(item.id, 1)}
                      disabled={idx === items.length - 1}
                      title="Dolje"
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-20 px-0.5 text-xs"
                    >▼</button>
                    <button
                      onClick={() => removeRow(item.id)}
                      title="Obriši"
                      className="text-red-400 hover:text-red-600 px-0.5 text-xs font-bold"
                    >✕</button>
                  </div>
                </td>
              </tr>
            )
          })}

          {/* Totals */}
          {items.length > 0 && (
            <tr className="bg-blue-50 border-t-2 border-blue-400 font-semibold">
              <td colSpan={14} className="border border-gray-300 px-2 py-1.5 text-right text-sm text-gray-600">
                UKUPNO (neto):
              </td>
              <td className="border border-gray-300 px-1 py-1.5 text-center text-sm">
                {totalSurface.toFixed(3)} m²
              </td>
              <td className="border border-gray-300 px-1 py-1.5 text-center text-sm text-blue-900">
                {totalMass.toFixed(2)} kg
              </td>
              <td className="border border-gray-300" />
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-3 flex gap-2">
        <button
          onClick={addRow}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium shadow-sm"
        >
          + Dodaj redak
        </button>
        <button
          onClick={duplicateLast}
          className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 font-medium border border-gray-300"
        >
          ⊕ Dupliciraj zadnji
        </button>
      </div>
    </div>
  )
}
