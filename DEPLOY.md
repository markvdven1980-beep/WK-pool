# Deployen naar de cloud (Netlify + Render + Supabase)

Deze handleiding zet de app volledig online, los van je laptop:

- **Frontend** → Netlify (statische React-build)
- **Backend** → Render (Express API, gratis tier)
- **Database** → Supabase (PostgreSQL)

Je hebt alleen een GitHub-account nodig en gratis accounts bij Netlify, Render en Supabase.

---

## Stap 0 — Code naar GitHub

```bash
cd wk-poule-2026
git add .
git commit -m "WK Poule 2026"
git branch -M main
git remote add origin https://github.com/<jouw-gebruiker>/wk-poule-2026.git
git push -u origin main
```

> De `.env`-bestanden en de lokale database staan in `.gitignore` en gaan dus **niet** mee — dat is de bedoeling.

---

## Stap 1 — Database op Supabase

1. Maak een project aan op [supabase.com](https://supabase.com).
2. Ga naar **Project Settings → Database → Connection string → URI**.
3. Kopieer de string. Die ziet er zo uit:
   ```
   postgresql://postgres:[WACHTWOORD]@db.[PROJECT].supabase.co:5432/postgres
   ```
4. Vervang `[WACHTWOORD]` door je database-wachtwoord. Bewaar deze string — die heb je zo nodig als `DATABASE_URL`.

---

## Stap 2 — Backend op Render

1. Ga naar [render.com](https://render.com) → **New → Blueprint**.
2. Koppel je GitHub-repo. Render leest automatisch `render.yaml`.
3. Vul bij de service de environment variables in:
   - `DATABASE_URL` → de Supabase-string uit stap 1
   - `CORS_ORIGIN` → laat voorlopig leeg of zet alvast je Netlify-URL (stap 3). Je kunt dit later aanpassen.
   - `JWT_SECRET` → wordt automatisch gegenereerd
   - `FOOTBALL_DATA_API_KEY` → optioneel (voor automatische uitslagen)
4. Klik **Apply**. Render draait automatisch:
   - `npm run build:prod` → genereert het PostgreSQL-schema en bouwt de app
   - `npm run db:push:prod` → maakt de tabellen aan in Supabase
   - `npm start` → start de API
5. Noteer de URL van je service, bijv. `https://wk-poule-backend.onrender.com`.

### Database vullen (eenmalig)

De 104 wedstrijden en de admin-gebruiker moeten één keer worden ingeladen.
Open in Render de **Shell** (tab bij je service) en draai:

```bash
npm run db:seed:prod
```

> ⚠️ Draai `db:seed` **nooit** opnieuw als er al gebruikers spelen — het wist alle data en laadt de wedstrijden opnieuw in.

---

## Stap 3 — Frontend op Netlify

1. Ga naar [netlify.com](https://netlify.com) → **Add new site → Import an existing project**.
2. Koppel je GitHub-repo. Netlify leest `frontend/netlify.toml` (build-instellingen staan er al in).
3. Ga naar **Site settings → Environment variables** en voeg toe:
   - `VITE_API_URL` → de Render-URL uit stap 2, bijv. `https://wk-poule-backend.onrender.com`
4. Klik **Deploy**. Na de build krijg je een URL, bijv. `https://wk-poule-2026.netlify.app`.

---

## Stap 4 — CORS koppelen

1. Ga terug naar Render → je backend → **Environment**.
2. Zet `CORS_ORIGIN` op je Netlify-URL (zonder slash op het eind):
   ```
   CORS_ORIGIN=https://wk-poule-2026.netlify.app
   ```
3. Render herstart automatisch. Klaar — de frontend praat nu met de backend.

---

## Inloggen als beheerder

De seed maakt een admin-gebruiker aan met gebruikersnaam **`admin`**.
Log daarmee in om uitslagen in te voeren en bonusvragen te beoordelen.

---

## Automatische uitslagen (optioneel)

Zet `FOOTBALL_DATA_API_KEY` (van [football-data.org](https://www.football-data.org/client/register))
in de Render-environment. De backend haalt dan elke 5 minuten automatisch de uitslagen op
en herberekent de punten. Zonder key werkt handmatige invoer via het admin-dashboard gewoon.

---

## Schema wijzigen na deployment

Het PostgreSQL-schema wordt automatisch afgeleid van `backend/prisma/schema.prisma`
(één bron van waarheid). Pas je het schema aan, push naar GitHub, dan draait Render bij de
volgende deploy automatisch `db:push:prod` en worden de wijzigingen doorgevoerd in Supabase.

---

## Samenvatting van de omgevingsvariabelen

| Plek    | Variabele                | Waarde                                            |
|---------|--------------------------|---------------------------------------------------|
| Render  | `DATABASE_URL`           | Supabase connection string                        |
| Render  | `CORS_ORIGIN`            | Netlify-URL (https://...netlify.app)              |
| Render  | `JWT_SECRET`             | automatisch gegenereerd                           |
| Render  | `FOOTBALL_DATA_API_KEY`  | optioneel — football-data.org key                 |
| Netlify | `VITE_API_URL`           | Render-URL (https://...onrender.com)              |
