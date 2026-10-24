# HVAC — Masa kanala i fazona

Web kalkulator **površine i mase limenih ventilacijskih kanala i fazona** (pravokutnih i okruglih) za izradu specifikacija, troškovnika i narudžbi lima.

## Mogućnosti

- Tablični unos stavki: kanal, koljeno 90° / 45° / proizvoljni kut, redukcija, T-komad, čep i prilagođena stavka s ručno upisanom površinom
- Pravokutni (a × b) i okrugli (Ø d) presjeci
- Automatska debljina lima iz orijentacijske tablice (ili ručni unos)
- Materijali: pocinčani čelik, nehrđajući čelik, aluminij
- **Dodatak za spojeve, prirubnice i ukrute** u % neto mase (tipično 10–20 %)
- Zbroj površine i mase te pregled po materijalu
- **Automatsko spremanje** projekta u preglednik (`localStorage`) kod svake promjene
- **Spremanje i otvaranje projekta kao `.json` datoteke** za arhivu, prijenos na drugo računalo ili slanje kolegi
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
| T-komad | L₁ = a₂ + 2·100 mm; S = 2(a+b)·L₁ − a₂·b₂ + 2(a₂+b₂)·0,15 | L₁ = d₂ + 2·100 mm; S = π·d·L₁ − π·d₂²/4 + π·d₂·0,15 |
| Čep | S = a · b | S = π · d² / 4 |

### T-komad

Model: ravni dio glavnog kanala duljine širine ogranka uvećane za 100 mm sa svake strane (`TEE_COLLAR`), umanjen za otvor ogranka, plus ogranak duljine 150 mm (`TEE_BRANCH_LENGTH`). Obje vrijednosti su u `src/utils/constants.ts`. a₂ je dimenzija ogranka uzduž glavnog kanala. Ako dimenzije ogranka nisu upisane, uzimaju se dimenzije glavnog kanala. Kod okruglog T-komada otvor se računa kao presjek ogranka (π·d₂²/4); stvarni sedlasti otvor je nešto veći kad je d₂ blizu d.

### Debljina lima (automatski, orijentacijski)

| Pravokutni — najveća stranica | δ (mm) | Okrugli — Ø | δ (mm) |
|---|---|---|---|
| ≤ 400 mm | 0,6 | ≤ 315 mm | 0,6 |
| ≤ 800 mm | 0,8 | ≤ 630 mm | 0,8 |
| ≤ 1250 mm | 1,0 | ≤ 1000 mm | 1,0 |
| ≤ 2000 mm | 1,25 | > 1000 mm | 1,25 |
| > 2000 mm | 1,5 | | |

Ovo su orijentacijske vrijednosti uobičajene prakse za niskotlačne kanale. Ranije navedena „DIN 24153” bila je pogrešna referenca: ta norma iz 1966. odnosi se na cijevi za spojeve s bordurom („Rohre für Bördelverbindungen”). Za debljinu lima povijesno su se koristili DIN 24190 (pravokutni kanali, povučena) i DIN 24145 (spiralne cijevi). Važeće EN 1505 / EN 1506 (dimenzije) i EN 1507 / EN 12237 (čvrstoća i nepropusnost) ne propisuju fiksnu debljinu. Ako projekt ili izvođač zahtijeva drugu debljinu, koristite „Ručno”.

### Gustoće materijala

| Materijal | ρ (kg/m³) |
|---|---|
| Pocinčani čelik | 7850 |
| Nehrđajući čelik | 7900 |
| Aluminij | 2700 |

## Datoteka projekta (.json)

**Spremi projekt** preuzima datoteku `<naziv_projekta>.json`. **Otvori projekt** je učitava i zamjenjuje trenutni projekt (prije toga traži potvrdu).

```json
{
  "format": "hvac-masa-kanala",
  "version": 1,
  "savedAt": "2026-10-24T12:00:00.000Z",
  "title": "Stambena zgrada A",
  "allowancePct": 12,
  "items": [ { "type": "duct", "shape": "rectangular", "a": 500, "b": 300, "length": 12, "material": "galvanized", "...": "..." } ]
}
```

Kod otvaranja se svaka stavka provjerava. Nedostajuća ili neispravna polja (npr. tekst umjesto broja, negativne dimenzije, nepoznat tip ili materijal) zamjenjuju se zadanim vrijednostima. Površina i masa uvijek se ponovno izračunavaju, a ne preuzimaju iz datoteke.

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

- Automatsko spremanje vrijedi samo u pregledniku na tom računalu. Ako se obriše povijest preglednika, projekt se gubi. Za arhivu koristite **Spremi projekt** (.json). CSV služi za Excel i ne može se ponovno otvoriti u kalkulatoru.
- T-komad se računa po gornjem modelu. Za posebne izvedbe (npr. kosi ogranak, ogranak s prijelazom) koristite stavku tipa *Prilagođeno*.
