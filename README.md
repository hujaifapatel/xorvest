# Prchesh: Health Insurance Comparison (MERN)

A MERN-stack health-insurance comparison site. Visitors answer a 15-question questionnaire in a pop-up, register or log in, and get a ranked list of plans from partner banks (HDFC Bank, SBI, ICICI Bank, Axis Bank, Kotak Mahindra Bank, Yes Bank, Bank of Baroda, PNB), with reasons, caveats, a recommended cover amount, filters, and a side-by-side comparison.

The site name lives in `client/src/brand.js`. Use a name you own, not that of an existing insurer.

## Stack

| Layer    | Choice |
|----------|--------|
| Database | **MongoDB** (Atlas) via Mongoose: `banks`, `plans` (ref → bank), `users`, `assessments` (ref → user) |
| API      | Express, JWT auth (bcrypt-hashed passwords) |
| Client   | React 18 + React Router, built with Vite; hand-written CSS |

## Running locally

```bash
npm run install:all
npm run dev            # API :5050, site :5173
```

`server/.env` (git-ignored) needs:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/xorvest?retryWrites=true&w=majority&appName=Xorvest
JWT_SECRET=<long random string>
PORT=5050
CLIENT_ORIGIN=http://localhost:5173
```

Without `MONGODB_URI` the API uses an in-memory MongoDB. Banks and plans are seeded automatically when the catalogue is missing or outdated; `npm run seed` forces a re-seed. `npm test` runs the engine and validation tests.

## Flow

1. **Questionnaire pop-up** (`client/src/components/Wizard.jsx`): gender → members (self, spouse, sons, daughters, father, mother) → age of each adult → city → existing illness → tobacco → admissions → maternity → income → budget → employer cover → room → co-pay → OPD → priority. It can be started from the home-page quote card with members pre-filled.
2. **Register / log in**: shown as the last step if the visitor is signed out. Results and history require an account.
3. **Results** (`/plans/:id`): recommended cover, plan cards with match %, monthly premium, highlights, "why this plan", filters (bank, within budget, sort) and a compare tray.
4. **Compare** (`/compare`), **All plans** (`/all-plans`), **My recommendations** (`/account`).

## API

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | – |
| GET | `/api/auth/me` | ✓ |
| GET | `/api/questions`, `/api/banks`, `/api/plans?slugs=&bank=` | – |
| POST | `/api/assessments` `{ answers }` | ✓ |
| GET | `/api/assessments`, `/api/assessments/:id` (own only) | ✓ |

## Recommendation engine (`server/src/engine/score.js`)

The profile (adults, children, eldest age, city tier, conditions, budget, preferences) leads to:

1. **Recommended cover:** sized by city, family size, age and health, then rounded to the nearest standard band.
2. **Eligibility:** checks entry age, floater availability, senior-only plans, and conditions a plan declines.
3. **Estimated premium:** age band × family × cover × city × loadings, plus 18% GST.
4. **Match score:** a weighted score across affordability, coverage, claims, network, existing-illness waiting period, maternity, room rent, co-pay, OPD and restore. The visitor's priority is boosted.
5. **Explanation:** reasons and caveats, with the user's own needs listed first.

## Data notice

Bank service metrics, plan names, premiums and benefits in `server/src/seed/` are **sample data** for demonstration and are not offers from the banks named. Replace them with licensed data before public use; selling or advising on insurance in India requires IRDAI registration.
