# WK Poule 2026 ⚽

Voorspel alle 104 wedstrijden van het FIFA Wereldkampioenschap 2026 en strijd met vrienden, familie of collega's in jouw eigen poule!

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (via Prisma ORM)
- **Auth**: Simpele gebruikersnaam-login (geen wachtwoord nodig)

## Setup

### Vereisten

- Node.js 18+ (aanbevolen: 22 LTS)
- npm 9+

### Installatie

```bash
# Clone het project
cd wk-poule-2026

# Installeer alle afhankelijkheden
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Backend .env aanmaken (lokaal SQLite)
cd backend
cp .env.example .env

# Database aanmaken en vullen met alle 104 wedstrijden
npx prisma migrate dev --name init
npm run db:seed
cd ..
```

> De `backend/.env` bevat lokaal `DATABASE_URL="file:./dev.db"`. Voor productie zie [DEPLOY.md](DEPLOY.md).

### Starten

```bash
# Start backend + frontend tegelijk
npm run dev
```

Of apart:

```bash
# Terminal 1: Backend (poort 3001)
cd backend && npm run dev

# Terminal 2: Frontend (poort 5173)
cd frontend && npm run dev
```

Open http://localhost:5173 in je browser.

## Gebruik

1. **Registreer** met een gebruikersnaam en naam
2. **Maak een poule aan** of neem deel met een uitnodigingscode
3. **Voorspel** de uitslagen van alle groepswedstrijden
4. Bekijk de **ranglijst** in je poule

### Admin

Login als `admin` om uitslagen in te voeren na wedstrijden.

### Automatisch uitslagen ophalen (optioneel)

De app kan de WK-uitslagen automatisch ophalen en de punten direct verwerken:

1. Vraag een gratis API-key aan op [football-data.org](https://www.football-data.org/client/register)
2. Kopieer `backend/.env.example` naar `backend/.env`
3. Vul je key in bij `FOOTBALL_DATA_API_KEY=`
4. Herstart de backend

Zodra de key is ingesteld:
- haalt de backend **elke 5 minuten** automatisch nieuwe eindstanden op
- worden de punten van alle deelnemers **automatisch herberekend**
- kun je in het admin-dashboard ook handmatig op **🔄 Sync nu** klikken

Zonder API-key blijft handmatige invoer via het admin-dashboard gewoon werken.

## Online zetten (cloud)

Wil je de app volledig in de cloud draaien (Netlify + Render + Supabase), los van je laptop?
Zie de stap-voor-stap handleiding in **[DEPLOY.md](DEPLOY.md)**.

## Functionaliteiten

- 104 WK 2026 wedstrijden (groepsfase + knock-out)
- Voorspellingen met deadline (1 min voor aftrap)
- Puntensysteem: exact (5pt), toto (2pt), 1 ernaast (1pt)
- Puntenvermenigvuldigers per ronde (groep x1 t/m finale x6)
- Jokers (2 per deelnemer, verdubbelen punten)
- Live ranglijst per poule
- Countdown timer naar volgende wedstrijd
- Admin dashboard voor uitslagen invoeren
- Mobile-first responsive design

## Projectstructuur

```
wk-poule-2026/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── pages/     # LoginPage, MatchesPage, PoolsPage, etc.
│       ├── components/# MatchCard, CountdownTimer
│       └── api.ts     # API client
├── backend/           # Express + Prisma
│   ├── src/
│   │   ├── routes/    # auth, matches, predictions, pools, admin
│   │   └── services/  # scoring engine
│   └── prisma/        # Schema + seed data
└── shared/            # Gedeelde TypeScript types
```
