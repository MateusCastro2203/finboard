create table if not exists anotacoes (
  id          uuid default gen_random_uuid() primary key,
  company_id  uuid references companies(id) on delete cascade not null,
  periodo     text not null,
  texto       text not null default '',
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now(),
  unique (company_id, periodo)
);

alter table anotacoes enable row level security;

create policy "Usuário vê apenas suas próprias anotações"
  on anotacoes for all
  using (
    company_id in (
      select id from companies where user_id = auth.uid()
    )
  );
