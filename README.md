# Zwijsen Upcycle

Transformeer statische PDF-oefeningen van Zwijsen naar interactieve, slimme leerervaringen met generatieve AI.

## Stack

- **Frontend/Backend**: Next.js 14 (App Router) op Vercel
- **Database + Storage**: Supabase (PostgreSQL + object storage)
- **AI**: Groq API (Llama 4 Scout voor vision, Llama 3.3 70B voor transformaties)

## Functionaliteit

1. **Upload** een PDF-werkboekpagina
2. **AI** extraheert automatisch alle oefeningen en detecteert het type
3. **Editor** reviewt de output zij aan zij met de originele PDF
4. **Goedgekeurde oefeningen** zijn direct interactief te spelen
5. **Varianten** kunnen worden gegenereerd op 3 moeilijkheidsniveaus

## Setup

### 1. Kloon de repo en installeer dependencies

```bash
git clone https://github.com/jouw-username/zwijsen-upcycle
cd zwijsen-upcycle
npm install
```

### 2. Supabase instellen

1. Ga naar [supabase.com](https://supabase.com) en open je project
2. Ga naar **SQL Editor**
3. Plak de inhoud van `supabase/schema.sql` en voer uit
4. Ga naar **Project Settings > API** en kopieer:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 3. Environment variables

Kopieer `.env.local.example` naar `.env.local` en vul in:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...
```

### 4. Lokaal starten

```bash
npm run dev
```

Ga naar [http://localhost:3000](http://localhost:3000)

## Deployen op Vercel

1. Push de repo naar GitHub
2. Ga naar [vercel.com](https://vercel.com) en importeer de repo
3. Voeg de environment variables toe in Vercel dashboard
4. Deploy

## Projectstructuur

```
src/
  app/
    page.tsx              # Dashboard
    upload/               # PDF upload pagina
    review/[uploadId]/    # Editor review (zij aan zij)
    library/              # Oefeningen bibliotheek
    exercise/[id]/        # Interactieve oefening + variant generator
    api/
      upload/             # PDF upload naar Supabase Storage
      extract/            # AI extractie pipeline (Groq Vision)
      exercises/          # CRUD voor oefeningen
      generate-variant/   # Variant generatie (Groq)
      upload-info/        # Upload status ophalen
  components/
    Navbar.tsx
    InteractiveExercise.tsx   # Alle 4 oefeningtypen
  lib/
    supabase.ts
    groq.ts               # Groq integratie + prompts
    types.ts              # Gedeelde TypeScript types
supabase/
  schema.sql              # Database schema
```

## Vraagtypen

| Type | Omschrijving | Voorbeeld |
|------|--------------|-----------|
| `fill_in` | Vul de ontbrekende waarden in | `763 = ___ + ___ + ___` |
| `structured_hte` | H-T-E splits- of samenvoeg-oefeningen | H=7, T=6, E=3 |
| `creative` | Maak getallen met gegeven cijfers | Cijfers: 3, 5, 1 |
| `pattern_puzzle` | Bereken de waarde van figuren | ● + ■ = 7123 |

## Moeilijkheidsniveaus

| Niveau | Getallen |
|--------|---------|
| 1 | 100-499 |
| 2 | 500-799 |
| 3 | 800-999 |
