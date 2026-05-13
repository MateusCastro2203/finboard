ALTER TABLE public.fluxo_caixa
  ADD COLUMN IF NOT EXISTS recorrencia TEXT CHECK (recorrencia IN ('semanal', 'mensal')),
  ADD COLUMN IF NOT EXISTS recorrencia_grupo UUID;

CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_grupo
  ON public.fluxo_caixa(company_id, recorrencia_grupo)
  WHERE recorrencia_grupo IS NOT NULL;
