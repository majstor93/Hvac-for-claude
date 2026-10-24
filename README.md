# HVAC — Masa kanala i fazona

Web kalkulator **površine i mase limenih ventilacijskih kanala i fazona** (pravokutnih i okruglih) za izradu specifikacija, troškovnika i narudžbi lima.

## Mogućnosti

- Tablični unos stavki: kanal, koljeno 90° / 45° / proizvoljni kut, redukcija, T-komad, čep i prilagođena stavka s ručno upisanom površinom
- Pravokutni (a × b) i okrugli (Ø d) presjeci
- Automatska debljina lima prema tablici (ili ručni unos)
- Materijali: pocinčani čelik, nehrđajući čelik, aluminij
- **Dodatak za spojeve, prirubnice i ukrute** u % neto mase (tipično 10–20 %)
- Zbroj površine i mase te pregled po materijalu
- **Automatsko spremanje** projekta u preglednik (`localStorage`) kod svake promjene
- Izvoz u CSV (separator `;`, UTF-8 s BOM-om, otvara se izravno u Excelu)
- Ispis / PDF u formatu A4 landscape sa zaglavljem projekta

## Jedinice unosa

| Podatak | Jedinica |
|---|---|
| Dimenzije a, b, d, a₂, b₂, d₂ | mm |
| Duljina kanala | m |
| Fazone | kom |
| Površina prilagođene stavke | m² (ukupno) |
| Debljina lima δ | mm |

## Formule

Masa: **m = S × δ × ρ**, a ukupna masa: **m_ukupno = m × (1 + dodatak / 100)**

| Element | Pravokutni | Okrugli |
|---|---|---|
| Kanal | S = 2(a + b) · L | S = π · d · L |
| Koljeno (kut θ) | R = a; S = θ(2R + a)·b + θ·a(2R + a) | R_c = 1,5·d; S = π·d·θ·R_c |
| Redukcija | L = max(\|a−a₂\|, \|b−b₂\|)/2 + 150 mm; S = (a+a₂)·h₁ + (b+b₂)·h₂, h₁ = √(L² + ((b−b₂)/2)²), h₂ = √(L² + ((a−a₂)/2)²) | L = \|d−d₂\|/2 + 150 mm; S = π(d+d₂)/2 · √(L² + ((d−d₂)/2)²) |
| T-komad | približna procjena | približna procjena |
| Čep | S = a · b | S = π · d² / 4 |

### Debljina lima (automatski)

| Pravokutni — najveća stranica | δ (mm) | Okrugli — Ø | δ (mm) |
|---|---|---|---|
| ≤ 400 mm | 0,6 | ≤ 315 mm | 0,6 |
| ≤ 800 mm | 0,8 | ≤ 630 mm | 0,8 |
| ≤ 1250 mm | 1,0 | ≤ 1000 mm | 1,0 |
| ≤ 2000 mm | 1,25 | > 1000 mm | 1,25 |
| > 2000 mm | 1,5 | | |

### Gustoće materijala

| Materijal | ρ (kg/m³) |
|---|---|
| Pocinčani čelik | 7850 |
| Nehrđajući čelik | 7900 |
| Aluminij | 2700 |

## Pokretanje

Potreban je Node.js 22 ili noviji.

```bash
npm install
npm run dev       # razvojni server na http://localhost:5173
npm run build     # produkcijski build u mapu dist/
npm run preview   # pregled produkcijskog builda
npm run lint      # provjera koda (ESLint)
```

## Struktura

```
src/
├── App.tsx                  # glavni ekran, spremanje, dodatak, CSV, ispis
├── types.ts                 # modeli podataka i hrvatski nazivi
├── components/DuctTable.tsx # tablica za unos stavki
└── utils/
    ├── calculations.ts      # formule za površinu, debljinu i masu
    ├── constants.ts         # tablice debljina lima i gustoće
    └── items.ts             # nova stavka i učitavanje spremljenih stavki
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) kod svakog pusha i pull requesta pokreće `npm ci`, `npm run lint` i `npm run build`.

## Napomene

- Podaci se spremaju samo u preglednik na tom računalu. Ako se obriše povijest preglednika, projekt se gubi. Za arhivu koristite **Izvoz CSV**.
- Površina T-komada je približna procjena. Za točan iznos koristite stavku tipa *Prilagođeno*.
