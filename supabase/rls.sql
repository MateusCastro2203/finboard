-- ============================================================
-- FinBoard - Row Level Security (RLS)
-- Execute APÓS o schema.sql
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dre_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxo_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
CREATE POLICY "users_own_profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- ---- COMPANIES ----
CREATE POLICY "users_own_companies" ON public.companies
  FOR ALL USING (auth.uid() = user_id);

-- ---- DRE LANÇAMENTOS ----
CREATE POLICY "users_own_dre" ON public.dre_lancamentos
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- ---- FLUXO DE CAIXA ----
CREATE POLICY "users_own_fluxo" ON public.fluxo_caixa
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.companies WHERE user_id = auth.uid()
    )
  );

-- ---- PURCHASES ----
CREATE POLICY "users_own_purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_purchases" ON public.purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role bypassa RLS automaticamente para o webhook
