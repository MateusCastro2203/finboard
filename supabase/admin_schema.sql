-- ============================================================
-- FinBoard - Admin Role
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar coluna is_admin na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Tornar seu usuário admin (substitua pelo seu user ID do Supabase Auth)
-- Vá em Authentication > Users, copie o UUID do seu usuário e cole abaixo:
-- UPDATE public.profiles SET is_admin = TRUE WHERE id = 'SEU-UUID-AQUI';
