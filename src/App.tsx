import { useState } from 'react'
import type { DuctItem } from './types'
import { MATERIAL_LABELS } from './types'
import DuctTable from './components/DuctTable'
import { normalizeItem } from './utils/items'

const PROJECT_KEY = 'hvac_project_v1'

interface Project {
  title: string
  items: DuctItem[]
  // Allowance for seams, flanges and stiffeners (% of net mass)
  allowancePct: number
}

function loadProject(): Project {
  const empty: Project = { title: 'Novi projekt', items: [], allowancePct: 0 }
  try {
    const raw = localStorage.getItem(PROJECT_KEY)
    if (!raw) return empty
    const p = JSON.parse(raw)
    return {
      title: typeof p.title === 'string' ? p.title : empty.title,
      items: Array.isArray(p.items) ? p.items.map(normalizeItem) : [],
      allowancePct: typeof p.allowancePct === 'number' ? p.allowancePct : 0,
    }
  } catch {
    return empty
  }
}

/** Returns false when the browser refuses to store the project */
function saveProject(project: Project): boolean {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(project))
    return true
  } catch {
    return false
  }
}

export default function App() {
  const [project, setProject] = useState<Project>(loadProject)
  const [saveOk, setSaveOk] = useState(true)
  const { title: projectTitle, items, allowancePct } = project

  // Every change is written to the browser immediately
  function updateProject(patch: Partial<Project>) {
    const next = { ...project, ...patch }
    setProject(next)
    setSaveOk(saveProject(next))
  }

  const setItems = (newItems: DuctItem[]) => updateProject({ items: newItems })
  const setProjectTitle = (t: string) => updateProject({ title: t })

  function setAllowance(v: string) {
    const n = parseFloat(v)
    updateProject({ allowancePct: isNaN(n) ? 0 : Math.min(Math.max(n, 0), 100) })
  }

  function handleNew() {
    if (items.length > 0 && !confirm('Pokrenuti novi projekt? Trenutni projekt bit će zamijenjen praznim (savjet: prije toga izvezite CSV).')) return
    updateProject({ title: 'Novi projekt', items: [] })
  }

  function handleExportCSV() {
    const header = [
      'Rb.', 'Naziv', 'Tip', 'Oblik', 'a(mm)', 'b(mm)', 'd(mm)',
      'a2(mm)', 'b2/d2(mm)', 'Kut°', 'Duljina/kom', 'Materijal',
      'Deb.lima(mm)', 'Površina(m2)', 'Masa(kg)',
    ]
    const rows = items.map((item, i) => [
      i + 1,
      item.name,
      item.type,
      item.shape,
      item.shape === 'rectangular' ? item.a : '',
      item.shape === 'rectangular' ? item.b : '',
      item.shape === 'round' ? item.d : '',
      item.a2 || '',
      item.shape === 'rectangular' ? (item.b2 || '') : (item.d2 || ''),
      item.type === 'elbow_custom' ? item.angle : '',
      item.type === 'custom' ? '' : item.length,
      MATERIAL_LABELS[item.material],
      item.thickness.toFixed(2),
      item.surfaceArea.toFixed(3),
      item.mass.toFixed(2),
    ])
    const pad = Array(12).fill('')
    const totals = [
      ['UKUPNO (neto)', ...pad, totalSurface.toFixed(3), netMass.toFixed(2)],
      [`Dodatak za spojeve (${allowancePct} %)`, ...pad, '', allowanceMass.toFixed(2)],
      ['UKUPNO S DODATKOM', ...pad, '', totalMass.toFixed(2)],
    ]

    const csv = [header, ...rows, [], ...totals]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectTitle.replace(/\s+/g, '_')}_masa_kanala.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalSurface = items.reduce((s, i) => s + i.surfaceArea, 0)
  const netMass = items.reduce((s, i) => s + i.mass, 0)
  const allowanceMass = netMass * allowancePct / 100
  const totalMass = netMass + allowanceMass

  const byMaterial = items.reduce<Record<string, { surface: number; mass: number }>>((acc, item) => {
    if (!acc[item.material]) acc[item.material] = { surface: 0, mass: 0 }
    acc[item.material].surface += item.surfaceArea
    acc[item.material].mass += item.mass
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-lg print:hidden">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">HVAC — Masa kanala i fazona</h1>
              <p className="text-blue-300 text-xs">Kalkulator mase ventilacijskih kanala</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleNew}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-sm rounded border border-blue-500 transition-colors">
              Novi projekt
            </button>
            <button onClick={handleExportCSV}
              className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-sm rounded border border-green-500 transition-colors">
              Izvoz CSV
            </button>
            <button onClick={() => window.print()}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-sm rounded border border-gray-500 transition-colors">
              Ispis / PDF
            </button>
          </div>
        </div>
      </header>

      {/* Print header */}
      <div className="hidden print:block px-6 pt-4 pb-2 border-b-2 border-gray-800 mb-4">
        <h1 className="text-xl font-bold">HVAC — Masa ventilacijskih kanala i fazona</h1>
        <div className="flex gap-6 text-sm text-gray-600 mt-1">
          <span>Projekt: <strong>{projectTitle}</strong></span>
          <span>Datum: <strong>{new Date().toLocaleDateString('hr-HR')}</strong></span>
          <span>Ukupna masa: <strong>{totalMass.toFixed(2)} kg</strong>
            {allowancePct > 0 && <> (neto {netMass.toFixed(2)} kg + {allowancePct} % dodatak)</>}
          </span>
          <span>Ukupna površina: <strong>{totalSurface.toFixed(3)} m²</strong></span>
        </div>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 py-4">
        {/* Project title row */}
        <div className="mb-4 flex items-center gap-3 print:hidden">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Naziv projekta:</label>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="flex-1 max-w-sm px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
            placeholder="Upiši naziv projekta..."
          />
          {saveOk ? (
            <span className="text-xs text-green-700">✓ Automatski spremljeno u preglednik</span>
          ) : (
            <span className="text-xs text-red-600 font-medium">
              ⚠ Spremanje nije uspjelo (preglednik blokira ili je spremište puno) — izvezite CSV
            </span>
          )}
        </div>

        {/* Allowance row */}
        <div className="mb-4 flex items-center gap-3 flex-wrap print:hidden">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
            Dodatak za spojeve, prirubnice i ukrute:
          </label>
          <input
            type="number" min={0} max={100} step={1}
            value={allowancePct || ''}
            onChange={(e) => setAllowance(e.target.value)}
            placeholder="0"
            className="w-20 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm"
          />
          <span className="text-sm text-gray-600">%</span>
          <span className="text-xs text-gray-400">(tipično 10–20 % neto mase lima)</span>
        </div>

        {/* Info */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 print:hidden">
          <strong>Uputa za unos:</strong> Dimenzije su u <strong>milimetrima</strong>.
          Duljina kanala u <strong>metrima</strong>, fazone unosite po <strong>komadima</strong>.
          Debljina lima se automatski određuje prema <strong>DIN 24153</strong> ovisno o dimenzijama kanala.
          Za prilagođenu stavku (tip "Prilagođeno") ručno unesite površinu.
        </div>

        {/* Main table card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <DuctTable items={items} onChange={setItems} />
        </div>

        {/* Summary cards */}
        {items.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Ukupna površina</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalSurface.toFixed(2)}</p>
                <p className="text-sm text-gray-500">m²</p>
              </div>
              <div className="bg-blue-700 text-white rounded-lg shadow-sm p-4">
                <p className="text-xs text-blue-200 uppercase tracking-wide font-medium">
                  Ukupna masa{allowancePct > 0 ? ' s dodatkom' : ''}
                </p>
                <p className="text-3xl font-bold mt-1">{totalMass.toFixed(1)}</p>
                <p className="text-sm text-blue-200">
                  kg{allowancePct > 0 && <> · neto {netMass.toFixed(1)} + {allowanceMass.toFixed(1)} ({allowancePct} %)</>}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Broj stavki</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{items.length}</p>
                <p className="text-sm text-gray-500">redaka</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Prosj. masa lima (neto)</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {totalSurface > 0 ? (netMass / totalSurface).toFixed(1) : '—'}
                </p>
                <p className="text-sm text-gray-500">kg/m²</p>
              </div>
            </div>

            {Object.keys(byMaterial).length > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Pregled po materijalu</h2>
                <table className="text-sm w-full max-w-md">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                      <th className="text-left pb-2 font-medium">Materijal</th>
                      <th className="text-right pb-2 font-medium">Površina (m²)</th>
                      <th className="text-right pb-2 font-medium">Masa neto (kg)</th>
                      <th className="text-right pb-2 font-medium">Udio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(byMaterial).map(([mat, val]) => (
                      <tr key={mat} className="border-b border-gray-100">
                        <td className="py-1.5">{MATERIAL_LABELS[mat as keyof typeof MATERIAL_LABELS]}</td>
                        <td className="text-right py-1.5">{val.surface.toFixed(3)}</td>
                        <td className="text-right py-1.5 font-semibold">{val.mass.toFixed(2)}</td>
                        <td className="text-right py-1.5 text-gray-500">
                          {netMass > 0 ? ((val.mass / netMass) * 100).toFixed(1) : '0'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Formula reference */}
        <details className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 print:hidden">
          <summary className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
            Formule i referentne vrijednosti ▾
          </summary>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Površine elemenata</h3>
              <ul className="space-y-1.5">
                <li><strong>Pravokutni kanal:</strong> S = 2×(a+b) × L [m²]</li>
                <li><strong>Okrugli kanal:</strong> S = π×d × L [m²]</li>
                <li><strong>Koljeno 90° pravokutno</strong> (R=a):<br/>S = π/2 × (a+b) × (2a+a) [m²]</li>
                <li><strong>Koljeno 90° okruglo</strong> (R_c=1.5d):<br/>S = π²×d×1.5d/2 [m²]</li>
                <li><strong>Redukcija pravokutna</strong> (L = max(|a−a₂|, |b−b₂|)/2 + 150 mm):<br/>
                  S = (a+a₂)×h₁ + (b+b₂)×h₂, h₁ = √(L²+((b−b₂)/2)²), h₂ = √(L²+((a−a₂)/2)²)</li>
                <li><strong>Čep:</strong> S = a×b ili π×(d/2)²</li>
              </ul>
              <p className="mt-3 font-semibold text-gray-700">Masa:</p>
              <p>m = S × δ × ρ [kg]</p>
              <p className="mt-1">m_ukupno = m × (1 + dodatak/100)</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Debljina lima — DIN 24153 (mm)</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-medium">
                    <th className="text-left border border-gray-200 px-2 py-1">Max stranica / Ø</th>
                    <th className="text-right border border-gray-200 px-2 py-1">Pravokutni</th>
                    <th className="text-right border border-gray-200 px-2 py-1">Okrugli</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['≤ 315 mm', '0.6', '0.6'],
                    ['316–400 mm', '0.6', '—'],
                    ['316–630 mm', '—', '0.8'],
                    ['401–800 mm', '0.8', '—'],
                    ['631–1000 mm', '—', '1.0'],
                    ['801–1250 mm', '1.0', '—'],
                    ['1001–2000 mm', '1.25', '1.25'],
                    ['> 2000 mm', '1.5', '—'],
                  ].map(([range, rect, round]) => (
                    <tr key={range} className="border-b border-gray-100">
                      <td className="border border-gray-200 px-2 py-0.5">{range}</td>
                      <td className="text-right border border-gray-200 px-2 py-0.5">{rect}</td>
                      <td className="text-right border border-gray-200 px-2 py-0.5">{round}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 font-semibold text-gray-700">Gustoće materijala:</p>
              <ul className="space-y-0.5 mt-1">
                <li>Pocinčani čelik: 7850 kg/m³</li>
                <li>Nehrđajući čelik: 7900 kg/m³</li>
                <li>Aluminij: 2700 kg/m³</li>
              </ul>
            </div>
          </div>
        </details>
      </main>

      <footer className="mt-8 py-3 text-center text-xs text-gray-400 border-t border-gray-200 print:hidden">
        HVAC Kalkulator mase kanala · DIN 24153 · Pocinčani čelik, nehrđajući čelik, aluminij
      </footer>
    </div>
  )
}
