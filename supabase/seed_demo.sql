-- ============================================================
-- FinBoard - Dados de Demonstração
-- Execute para popular dados demo em um usuário específico
-- Substitua 'SEU_USER_ID' pelo UUID real do usuário
-- ============================================================

-- 1. Crie a empresa
INSERT INTO public.companies (id, user_id, name, segmento)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'SEU_USER_ID',
  'Empresa Demo LTDA',
  'Indústria'
) ON CONFLICT DO NOTHING;

-- 2. Popula DRE (Jan-Dez 2024)
DO $$
DECLARE
  months DATE[] := ARRAY[
    '2024-01-01','2024-02-01','2024-03-01','2024-04-01',
    '2024-05-01','2024-06-01','2024-07-01','2024-08-01',
    '2024-09-01','2024-10-01','2024-11-01','2024-12-01'
  ];
  m DATE;
  base NUMERIC := 850000;
  growth NUMERIC := 1.0;
BEGIN
  FOREACH m IN ARRAY months LOOP
    growth := growth * (1 + (random() * 0.06 - 0.01));
    INSERT INTO public.dre_lancamentos (company_id, periodo, categoria, valor) VALUES
      ('aaaaaaaa-0000-0000-0000-000000000001', m, 'receita_bruta',         ROUND((base * growth)::NUMERIC, 2)),
      ('aaaaaaaa-0000-0000-0000-000000000001', m, 'deducoes',              ROUND((base * growth * 0.13)::NUMERIC, 2)),
      ('aaaaaaaa-0000-0000-0000-000000000001', m, 'cmv',                   ROUND((base * growth * 0.38)::NUMERIC, 2)),
      ('aaaaaaaa-0000-0000-0000-000000000001', m, 'despesas_comerciais',   ROUND((base * growth * 0.07)::NUMERIC, 2)),
      ('aaaaaaaa-0000-0000-0000-000000000001', m, 'despesas_administrativas', ROUND((base * growth * 0.09)::NUMERIC, 2)),
      ('aaaaaaaa-0000-0000-0000-000000000001', m, 'despesas_pessoal',      ROUND((base * growth * 0.12)::NUMERIC, 2)),
      ('aaaaaaaa-0000-0000-0000-000000000001', m, 'outras_despesas_op',    ROUND((base * growth * 0.02)::NUMERIC, 2)),
      ('aaaaaaaa-0000-0000-0000-000000000001', m, 'depreciacao',           ROUND((base * growth * 0.015)::NUMERIC, 2)),
      ('aaaaaaaa-0000-0000-0000-000000000001', m, 'resultado_financeiro',  ROUND((base * growth * -0.018)::NUMERIC, 2)),
      ('aaaaaaaa-0000-0000-0000-000000000001', m, 'ir_csll',               ROUND((base * growth * 0.025)::NUMERIC, 2))
    ON CONFLICT (company_id, periodo, categoria) DO NOTHING;
  END LOOP;
END $$;
