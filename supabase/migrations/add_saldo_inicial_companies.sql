ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS saldo_inicial NUMERIC(15, 2) DEFAULT 0;
