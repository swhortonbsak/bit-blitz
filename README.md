# Bit Blitz — Hex Storm Academy

A browser-based retro arcade educational game for practising **8-bit** conversions between binary, denary (decimal), and hexadecimal.

Original artwork and branding — inspired by classic binary/hex classroom games, not a copy of any proprietary title.

## Run locally

```bash
cd ~/Projects/bit-blitz
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm test`     | Unit tests (conversions) |
| `npm run preview` | Preview production build |

## Features

- Six conversion modes plus **Mixed Mode**
- Difficulty: Easy (hints + place values), Medium, Hard (1.5× score)
- 8-bit only: binary `00000000`–`11111111`, denary 0–255, hex `00`–`FF`
- Local nickname leaderboard (no email) with teacher reset
- Keyboard: bits `1`–`8` / `Q`–`I`, Enter submit, Backspace clear

## Project layout

- `src/utils/conversions.ts` — conversion helpers (tested)
- `src/game/` — engine, scoring, questions
- `src/components/` — UI
- `src/utils/leaderboardStorage.ts` — `localStorage` (backend-ready interface)
