# Abrité: Health Insurance Comparison (MERN)

A visitor answers 14 questions (each with a follow-up) in a pop-up, logs in, and gets health plans from 8 banks ranked for their family. They can see why each plan fits, compare up to 3 plans, and save plans they're interested in.

**Stack:** MongoDB (Atlas) · Express · React (Vite) · Node.js

## Run it

```bash
npm run install:all   # once
npm run dev           # API on :5050, website on :5173
```

`server/.env` (never committed):

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/xorvest?retryWrites=true&w=majority
JWT_SECRET=<any long random text>
```

---

## 1. How the website flows

```
Home ──► Questionnaire pop-up (14 questions + follow-ups) ──► Summary of answers ──► Log in / Register ──► Results
                                                                                              │
                     My account ◄── "I'm interested" ◄────────────────────────────────────────┤
                                                                                              └──► Compare (up to 3)
```

1. **Home** (`pages/Home.jsx`): the quote card lets you pick your gender and family members. **View plans** opens the pop-up at the ages question; **Get quotes** in the header opens it from question 1.
2. **Questionnaire pop-up** (`components/Wizard.jsx`): one question at a time. Once a question is answered, its **follow-up** (sub question) appears underneath, and it can depend on the answer: tobacco "Yes" asks *how often?*, "No" asks *alcohol?*. Answering the follow-up moves to the next question. Answers are kept in `sessionStorage`, so a refresh doesn't lose them.
3. **Summary:** after the last question you see all your answers and follow-ups, each with an **Edit** button that jumps back to that question and then returns to the summary.
4. **Log in / Register** (`components/AuthForm.jsx`): shown only if you aren't logged in. Results are saved to your account, so login is required.
5. **Results** (`pages/Results.jsx`): the recommended cover amount (and how it was calculated), then plan cards with match %, monthly price, key features, "Why this plan?" (reasons and drawbacks), **I'm interested**, and **Add to compare**. You can sort and filter to your budget.
6. **Compare** (`pages/Compare.jsx`): a side-by-side table; ★ marks the best value in each row.
7. **My account** (`pages/Account.jsx`): your interested plans and past recommendations.
8. **All plans** (`pages/AllPlans.jsx`): the full catalogue, filterable by bank.

## 2. How the backend works

```
React (browser) ──HTTP /api/...──► Express (server/src/routes.js) ──Mongoose──► MongoDB Atlas
                  + login token         │
                                        └── engine.js (ranks plans)
```

| File | What it does |
|---|---|
| `index.js` | Starts Express, connects to MongoDB, loads the banks and plans, listens on port 5050 |
| `db.js` | Connects to Atlas; `seedCatalogue()` fills the banks and plans from `data.js` if they're missing |
| `models.js` | The 5 MongoDB collections (below) |
| `data.js` | The sample banks and plans |
| `questions.js` | The 14 questions, their follow-ups (`followUp`, chosen by `followUpFor()`), and a server-side check that every question and follow-up is answered |
| `engine.js` | The recommendation logic |
| `auth.js` | Register, login, and the `requireAuth` guard |
| `routes.js` | Every API endpoint |

### Database: 5 collections

| Collection | Holds | Linked to |
|---|---|---|
| `banks` | HDFC, SBI, ICICI, Axis, Kotak, Yes Bank, BoB, PNB: claim ratio, hospitals | – |
| `plans` | Each plan's rules: room rent, waiting periods, maternity, OPD, price base | `bank` → banks |
| `users` | Name, email, mobile, **hashed** password | – |
| `assessments` | One finished questionnaire: answers + ranked results | `user` → users |
| `interests` | Plans a user marked "interested", with the price they saw | `user`, `plan` |

### Login (JWT)

1. **Register:** the password is hashed with **bcrypt** (never stored as typed) and the user is saved.
2. **Login:** the password is checked against the hash, and the server returns a signed **JWT token** (valid 7 days).
3. The browser keeps the token in `localStorage` and sends it as `Authorization: Bearer <token>`.
4. `requireAuth` verifies the token on protected routes and sets `req.userId`, so a user can only read their own data.

### API endpoints

| Method | Path | Login? | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | – | Create account / log in → token |
| GET | `/api/auth/me` | ✓ | Who is logged in |
| GET | `/api/questions` · `/api/banks` · `/api/plans` | – | Questionnaire and catalogue |
| POST | `/api/assessments` | ✓ | Submit answers → ranked plans saved → returns id |
| GET | `/api/assessments` · `/api/assessments/:id` | ✓ | Past recommendations / one result |
| GET · POST · DELETE | `/api/interests` | ✓ | List / add / remove interested plans |

### The recommendation engine (`engine.js`)

When answers arrive at `POST /api/assessments`:

1. **Profile:** count adults and children, find the eldest age, and work out the city type (metro, large city, other).
2. **Recommended cover:** start from the city (₹10L metro, ₹7L large city, ₹5L other), add for family size, age 45+/60+ and existing illness, subtract half of any employer cover, cap by income, then round to a standard amount.
3. **Eligibility:** drop plans that fail on entry age, are senior-only, cover individuals only, or refuse an illness the family has.
4. **Price:** base rate × age factor × family size × cover size × city × loadings (tobacco, illness, co-pay), plus 18% GST.
5. **Match %:** each factor (price vs budget, coverage, claims record, hospitals, room fit, co-pay, plus illness, OPD, restore and check-up when relevant) scores 0–1. The weighted average becomes 0–100; the top priority counts double and the second priority ×1.4.
6. **Explain:** produce plain-English reasons and drawbacks, with the user's own needs first.

Results are sorted by match % and stored in `assessments`.

**Follow-ups that change the ranking:** tobacco frequency (price loading), second priority, wanting a free check-up, preferring large hospitals (network weight), accepted co-pay share, and planned treatment (favours short waiting periods). The other follow-ups (occupation, same city, medical check-up, family history, alcohol, admission reason, earners, payment frequency, previous policy, home care, deductible, OPD reason) are saved with the answers for reference.

## 3. Frontend structure

| File | Role |
|---|---|
| `App.jsx` | Header, footer, page routes, login-only pages |
| `lib/api.js` | All `fetch` calls to the API (adds the token) |
| `lib/session.jsx` | The logged-in user and interested plans, shared app-wide |
| `components/Wizard.jsx` | The questionnaire pop-up |
| `components/ui.jsx` | Icons, avatars, bank logo tile, Interested button |
| `pages/*` | One file per page |

## Data notice

Bank names are real, but plan names, prices and figures are **sample data** for demonstration, not offers from these banks. "Abrité" is an invented name. Selling insurance in India requires IRDAI registration.

`npm test` (in `server/`) runs the engine tests.
