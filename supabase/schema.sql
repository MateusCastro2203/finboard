-- ============================================================
-- FinBoard - Schema Supabase
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- Perfis de usuário (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  company_name TEXT,
  has_access BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Empresas (cada usuário pode ter 1 empresa no plano básico)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cnpj TEXT,
  segmento TEXT,
  moeda TEXT DEFAULT 'BRL',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Lançamentos da DRE (agrupado por período e categoria)
CREATE TABLE IF NOT EXISTS public.dre_lancamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  periodo DATE NOT NULL, -- sempre o primeiro dia do mês: 2024-01-01
  categoria TEXT NOT NULL CHECK (categoria IN (
    'receita_bruta',
    'deducoes',
    'cmv',
    'despesas_comerciais',
    'despesas_administrativas',
    'despesas_pessoal',
    'outras_despesas_op',
    'depreciacao',
    'resultado_financeiro',
    'ir_csll'
  )),
  descricao TEXT,
  valor NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(company_id, periodo, categoria)
);

-- Lançamentos de Fluxo de Caixa
CREATE TABLE IF NOT EXISTS public.fluxo_caixa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT NOT NULL CHECK (categoria IN (
    'operacional_recebimento',
    'operacional_pagamento',
    'investimento',
    'financiamento_entrada',
    'financiamento_saida'
  )),
  descricao TEXT NOT NULL,
  valor NUMERIC(15, 2) NOT NULL DEFAULT 0,
  realizado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Compras / Pagamentos
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  mp_merchant_order_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  amount NUMERIC(10, 2) DEFAULT 297.00,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_dre_company_periodo ON public.dre_lancamentos(company_id, periodo);
CREATE INDEX IF NOT EXISTS idx_fluxo_company_data ON public.fluxo_caixa(company_id, data);
CREATE INDEX IF NOT EXISTS idx_companies_user ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_mp_payment ON public.purchases(mp_payment_id);
