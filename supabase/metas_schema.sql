-- Tabela de metas orçamentárias por período
create table if not exists metas (
  id                   uuid default gen_random_uuid() primary key,
  company_id           uuid references companies(id) on delete cascade not null,
  periodo              text not null,  -- YYYY-MM
  receita_liquida_meta numeric,
  margem_ebitda_meta   numeric,        -- decimal (ex: 0.15 = 15%)
  lucro_liquido_meta   numeric,
  created_at           timestamp with time zone default now(),
  updated_at           timestamp with time zone default now(),
  unique (company_id, periodo)
);

-- RLS
alter table metas enable row level security;

create policy "Usuário vê apenas suas próprias metas"
  on metas for all
  using (
    company_id in (
      select id from companies where user_id = auth.uid()
    )
  );
