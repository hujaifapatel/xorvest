# Xorvest: Health Assurance Counsel

A MERN-stack health-insurance advisory site. Visitors answer a 14-question consultation; the server scores every plan in the register against their answers and returns a ranked shortlist with reasons, caveats, a recommended sum insured and a side-by-side comparison of up to three plans.

## Stack

| Layer    | Choice |
|----------|--------|
| Database | **MongoDB** via Mongoose. Plans are nested, uneven documents (maternity terms, restore rules, declined conditions), and each consultation is stored as one answers + results document. |
| API      | Express (Node 20+, ES modules) |
| Client   | React 18 + React Router, built with Vite; hand-written CSS (no UI kit) |

## Running locally

```bash
npm install                 # root (concurrently)
npm run install:all         # server + client
npm run dev                 # API on :5050, site on :5173
```

Without `MONGODB_URI` the API starts an **in-memory MongoDB** (via `mongodb-memory-server`) and seeds it on every start. To use a real database, copy `server/.env.example` to `server/.env`, set `MONGODB_URI`, and run `npm run seed`.

`npm test` runs the scoring-engine tests.

## How the recommendation works (`server/src/engine/score.js`)

1. **Profile**: answers become a household profile: adults, children, eldest age, city zone, conditions, budget, and preferences.
2. **Sum insured**: a city-based figure, raised for family size, age 45+/60+, pre-existing conditions and frequent admissions, with half of any employer cover credited, capped by income, then rounded up to a standard band.
3. **Eligibility**: plans are excluded for entry age, individual-only plans on families, senior plans for young households, and conditions the insurer declines.
4. **Premium estimate**: base rate × age band × family size × sum insured^0.55 × city zone × tobacco/PED loading × co-pay discount, plus 18% GST.
5. **Scoring**: up to eleven dimensions (affordability, coverage breadth, claims record, network, PED waiting, maternity, room-rent fit, co-pay, OPD, restore), each 0–1. Weights switch on only when the answers make them relevant, and the visitor's stated priority is boosted ×1.9.
6. **Explanation**: each plan returns plain-language reasons and caveats.

## API

| Method | Path | |
|---|---|---|
| GET | `/api/questions` | Chapters and questions (the single source for the wizard) |
| GET | `/api/plans?slugs=a,b` | The plan register, optionally filtered |
| POST | `/api/assessments` | `{ answers }` → validated, scored, stored; returns ranked results |
| GET | `/api/assessments/:id` | A stored recommendation |

## Data notice

The insurers and figures in `server/src/seed/plans.js` are **fictional** and exist only to exercise the engine. Replace them with licensed insurer data before any public use. Selling or advising on insurance in India requires IRDAI registration.
