# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server at http://localhost:5173
npm run build     # Type-check (tsc) then build for production
npm run preview   # Serve the production build locally
```

There are no test or lint scripts — TypeScript strict mode via `tsc` is the only static check.

## Architecture Overview

FinBoard is a financial reporting SaaS (DRE + Cash Flow + Margin Analysis) for SMEs. It is a React SPA backed entirely by Supabase — there is no custom API server.

### Frontend → Supabase data flow

- `src/App.tsx` — router. Protected routes require both a valid session **and** `profile.has_access === true`.
- `src/hooks/useAuth.ts` — single source of truth for auth state; fetches `profiles` row and subscribes to `onAuthStateChange`.
- `src/hooks/useFinancialData.ts` — loads company, `dre_lancamentos`, and `fluxo_caixa` rows for the authenticated user.
- `src/lib/utils.ts:calcularDre()` — all financial calculations (17 derived metrics: receita_líquida, EBITDA, margens, etc.) happen client-side here. Margins are computed as a percentage of `receita_liquida`.
- `src/lib/supabase.ts` — Supabase client, reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env`.

### Database (Supabase PostgreSQL)

Schema files live under `supabase/`. Key tables:
- `profiles` — extends `auth.users`; `has_access` (bool, default false) gates the app; `is_admin` gates `/admin`.
- `companies` — one per user; all financial data hangs off `company_id`.
- `dre_lancamentos` — income statement entries; 10 fixed category values (e.g. `receita_bruta`, `cmv`, `ir_csll`).
- `fluxo_caixa` — cash flow entries; direction is `entrada | saida`; 5 categories.
- `purchases` — Mercado Pago payment records; `mp_payment_id` is the MP external ID.
- `metas` / `anotacoes` — budget targets and period notes; upserted on `(company_id, periodo)`.

RLS is enabled on all tables (`supabase/rls.sql`). Every query is scoped by `auth.uid()`. Edge functions use the service-role key to bypass RLS.

### Payments (Mercado Pago)

Two Supabase Edge Functions (Deno, `supabase/functions/`):

1. **`create-payment`** — authenticates the user via JWT, creates a MP preference (R$ 98.60 lifetime), and returns the `init_point` redirect URL.
2. **`payment-webhook`** — receives MP notifications, fetches payment status from MP API, updates `purchases`, and sets `profiles.has_access = true` when `status === "approved"`.

Webhook signature verification exists but is optional (only runs if `MP_WEBHOOK_SECRET` is set).

### Key environment variables

Frontend (`.env`, prefix `VITE_`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Edge Functions (set via Supabase dashboard secrets):
- `MP_ACCESS_TOKEN`
- `APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MP_WEBHOOK_SECRET` (optional)

### Export system

`src/components/export/` — PDF reports use the browser print dialog via `PrintContainer`; XLSX uses ExcelJS. `useExportData.ts` aggregates data before either path.

### Demo mode

`/demo` is a public route. `useSeedDemo()` generates in-memory sample data; no Supabase writes occur.

### CSS / theming

Tailwind with CSS custom properties defined in `src/index.css`. Brand-specific variables: `--gold`, `--green`, `--red`; text hierarchy: `--text`, `--text-2`, `--text-3`; surface hierarchy: `--bg`, `--bg-card`, `--bg-card-2`.
