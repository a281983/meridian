# Meridian — Capital, by merit

A lightweight, config-driven MVP that scores founders and produces 24-hour, evidence-backed
$100K-check recommendations. Founders sign in and apply; investors sign in and browse a
ranked, decision-ready pipeline. (Built for the Hack-Nation "VC Brain" challenge.)

## Product shape

- **Two roles, one funnel.** Founders sign in with Google (demo) and apply; every applicant
  lands directly in the investors' ranked dashboard. Investors browse, drill into memos.
- **Demo Google login.** `lib/session.js` + `/api/session` set a lightweight role cookie —
  zero setup. Swap in real Auth.js later; the seam is those two files + `GoogleSignIn.js`.
- **Credit-score gauge, no naked numbers.** The Founder Score renders as a semicircle gauge
  (`components/ScoreGauge.js`) with an out-of-100 value, a plain-English band, and confidence.
- **Jargon-free axes.** Bullish/neutral/bear become ↑ Positive / → Neutral / ↓ Caution with
  colour + arrows (`components/Axis.js`), legible on a phone.

## Design (engine)

- **Config over code.** Everything a judge (or you) would want to retune — fund thesis,
  scoring weights, sourcing channels, memo structure — lives in `/config/*.yaml`. No code
  changes needed to re-target the fund.
- **Zero infra.** The "Memory" layer (`lib/store.js`) is flat JSON either way — local
  `/data/*.json` files when running on your laptop, or a Vercel Blob JSON object once
  deployed (Vercel's production filesystem is read-only, so local files can't be written
  to there). Which backend is used is picked automatically from env vars; nothing else
  in the app knows or cares which one is active.
- **One funnel.** Inbound applications (`/apply`) run through `lib/pipeline.js`. The outbound
  sourcing engine (`/api/source`, GitHub + Hacker News) is preserved in the codebase but
  unhooked from the UI — flip it back on if you want the brief's live-sourcing story.
- **3 axes, never averaged.** Founder / Market / Idea-vs-Market are independent scores
  with their own rating + trend (see `lib/scoring.js`).
- **Trust Score is per-claim.** Every extracted claim gets its own confidence level,
  verified against the web via Tavily where possible (see `verifyClaims` in `lib/scoring.js`).
- **Founder Score is persistent.** Lives in `data/founders.json`, keyed by founder
  identity, never resets across applications — degrades gracefully for cold-start
  founders instead of zeroing out (see `computeFounderScore`).

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in OPENAI_API_KEY and TAVILY_API_KEY
npm run dev
```

Open http://localhost:3000 — "Continue as Founder" to apply with a PDF deck, or
"Continue as Investor" to browse the ranked pipeline.

## Deploy

1. Push to a public GitHub repo, import it on Vercel.
2. Set `OPENAI_API_KEY` and `TAVILY_API_KEY` in the project's environment variables.
3. In the project's **Storage** tab, create a Blob store (access: Private) and connect
   it to this project. Vercel then auto-populates `BLOB_STORE_ID` / `VERCEL_OIDC_TOKEN`
   (or `BLOB_READ_WRITE_TOKEN`) — as soon as either is present, `lib/store.js` switches
   from local JSON files to Blob automatically. No code change needed.

Without step 3, the app still builds and serves the dashboard/UI fine, but writes
(`/apply`, `/api/source`, `/api/activate`) will fail in production since Vercel's
deployed filesystem is read-only outside of Blob/DB-backed storage.

## What's stubbed / out of scope

- ProductHunt and arXiv sourcing channels are defined in `config/sourcing-channels.yaml`
  but disabled by default (ProductHunt needs an OAuth token; arXiv is a fast follow).
- "Activate" only **drafts** outreach copy — it never sends anything.
- Portfolio monitoring, follow-on, fund ops, and exit are intentionally out of scope,
  per the brief.
