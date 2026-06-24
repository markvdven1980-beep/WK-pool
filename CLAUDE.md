# WK 2026 Poule — projectgids voor Claude

Nederlandse voetbalpool-webapp voor het FIFA WK 2026 (VS/Canada/Mexico, 11 juni – 19 juli 2026).
Deelnemers voorspellen wedstrijduitslagen + toto en bonusvragen; punten en klassement per poule.

> Gevoelige gegevens (productie-URL's, admin-wachtwoord, testaccounts) staan in
> **`CLAUDE.local.md`** (niet in git). Lees dat bestand voor inlog-/deploydetails.

## Tech stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 (`@tailwindcss/vite`). Map: `frontend/`.
- **Backend**: Node.js + Express + TypeScript. Map: `backend/`.
- **ORM/DB**: Prisma. Lokaal SQLite (`backend/prisma/dev.db`), productie PostgreSQL (Supabase).
- **Auth**: JWT (`jsonwebtoken`) + bcryptjs. Wachtwoorden worden gegenereerd (WK-thema), niet door de gebruiker gekozen.

## Hosting & deployment
- **Frontend → Netlify**, **Backend → Render**, **DB → Supabase**. Alles cloud; niets draait permanent lokaal.
- **Deploys gaan automatisch**: `git push origin main` → Netlify (frontend) en Render (backend) deployen vanzelf.
  Render is een gratis instance → "cold start" van 30-60 s na inactiviteit is normaal.
- GitHub-repo: zie `CLAUDE.local.md`.

## Lokaal draaien
```
# backend (poort 3001)
cd backend && npm run dev
# frontend (poort 5173) — Vite proxy stuurt /api door naar 3001
cd frontend && npm run dev
```
De lokale SQLite-db bevat alle 104 wedstrijden (seed draait alleen als de db leeg is).

## Belangrijke conventies & valkuilen (uit ervaring)
- **`import type`** gebruiken voor TypeScript-interfaces in de frontend, anders crasht Vite (ESM runtime).
- **Geen `nanoid`** (ESM-only, breekt de CommonJS-build) — gebruik `crypto.randomBytes` (zie `backend/src/routes/pools.ts`).
- **CORS**: geweigerde origins met `callback(null, false)` afhandelen, niet met een `Error` (anders 500).
- **Productie-build is strenger** (`tsc -b`): bv. `useRef<...|undefined>(undefined)` expliciet initialiseren.
- **Commit-messages**: schrijf ze naar een tijdelijk bestand en gebruik `git commit -F` — PowerShell here-strings
  parsen lastig met dubbele punten/koppeltekens.
- Datum/tijd altijd weergeven met `timeZone: 'Europe/Amsterdam'` (wedstrijdtijden staan als UTC in de db).
- **Voorspellingen niet stuk maken**: aanpassingen mogen nooit ingevulde voorspellingen/scores wijzigen.
  Voorspellingen worden per (gebruiker, wedstrijd, poule) opgeslagen en bij opslaan naar álle poules van de
  gebruiker gefan-out (zie `backend/src/routes/predictions.ts`).

## Domeinregels
- **Scoring** (`backend/src/services/scoring.ts`): exacte uitslag = 5 punten, toto goed = 2 (optelbaar → 7).
  1 doelpunt ernaast = 1 punt. Knockoutrondes hebben oplopende multipliers. **Nederland-wedstrijden altijd ×2.**
- **Bonusvragen** (`backend/src/services/bonus.ts`): wereldkampioen (25), topscorer WK (25), topscorer NL (25),
  doelpunten Curaçao (10), 12 groepswinnaars (elk 10). Deadline vóór WK-start.
- **WK 2026-data**: officiële FIFA-loting (dec 2025), 12 groepen A–L, 48 teams, 104 wedstrijden. Teams in
  `frontend/src/teams.ts` (`GROUPS`, `FLAGS`, `ALL_TEAMS`) en `backend/src/services/bonus.ts` (`OFFICIAL_GROUPS`).
  Knockout-wedstrijden hebben placeholders ("Winnaar A", "Nr. 2 B").

## Automatische uitslagen-sync
- `backend/src/services/resultsSync.ts` haalt elke 5 min uitslagen op via football-data.org (competitie `WC`),
  koppelt op teamnaam via `NAME_MAP` (Engels→NL, accent-/hoofdletter-tolerant).
- Vult ook **knockout-teams** automatisch in zodra bekend (conservatief: overschrijft nooit een handmatig
  ingevuld team). Vereist env `FOOTBALL_DATA_API_KEY` (staat in Render, niet lokaal).

## Admin-functies (Beheerder-pagina)
Uitslagen-sync, wedstrijdtijden corrigeren, voorspellingen synchroniseren, gebruikersbeheer (wachtwoord reset/
verwijderen), poulebeheer, bonusvragen beoordelen, **knockout-teams instellen** (dropdowns per wedstrijd),
gebruikersnamen opschonen. Endpoints in `backend/src/routes/admin.ts`.
