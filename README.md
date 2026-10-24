# Backstage — Production expense tracker (mobile)

Expense management for film, TV series and music-video productions. This first build is the **mobile app** (iOS, Android, and web preview) for three personas:

| Persona | What they can do |
| --- | --- |
| **Crew member** | Log expenses with receipt photo, category, vendor, GSTIN; track status (pending → approved → paid) |
| **Team manager** | Approve / reject / escalate team expenses (one-tap and bulk approve), watch department budgets, request more budget |
| **Producer** | Project overview (spent, remaining, burn rate, projection), clear escalations, approve budget requests, mark approved expenses paid |

### Approval rules
- Crew submits → department manager reviews.
- A manager approval over **₹25,000**, or one that would push the department over budget, is auto-escalated to the producer.
- Expenses a manager submits themselves go straight to the producer.
- Every action is written to the expense's audit trail.

## Run it

Requires **Node 22+** (`nvm use` reads `.nvmrc`).

```bash
npm install
npm run web      # browser preview
npm start        # then scan the QR with Expo Go on your phone
```

Sign in by picking a role and a demo user. Data is seeded and saved on the device; use **Profile → Reset demo data** to start over.

## Structure

```
App.tsx                      root: providers + login vs. role navigator
src/types.ts                 data model
src/store/Store.tsx          state, actions (submit/approve/escalate/pay), persistence
src/store/selectors.ts       budget & project calculations
src/store/seed.ts            demo project, departments, people, expenses
src/navigation/              tab + stack navigator, per-role tab setup
src/screens/{crew,manager,producer,shared}/
src/components/              UI kit and list rows
```

## Not built yet (from the PRD)
Cloud backend & real-time sync, OTP/MFA login, OCR receipt scanning, GST API validation, bank payouts, payroll & contracts, PDF/XLSX export, push notifications, finance/auditor/vendor roles, desktop app.
