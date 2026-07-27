-- 记账软件数据库 schema
-- 在 Supabase 控制台 -> SQL Editor 中粘贴执行

-- 两人共用的账本
create table if not exists ledgers (
  id uuid primary key default gen_random_uuid(),
  name text not null default '我们的账本',
  base_currency text not null default 'CNY',
  created_at timestamptz not null default now()
);

-- 账本成员（关联 auth.users）
create table if not exists ledger_members (
  ledger_id uuid references ledgers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  primary key (ledger_id, user_id)
);

-- 交易记录
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid references ledgers(id) on delete cascade,
  user_id uuid references auth.users(id),
  occurred_on date not null,
  type text not null check (type in ('income', 'expense')),
  currency text not null,
  amount numeric not null,
  exchange_rate numeric not null,
  base_amount numeric not null,
  category text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_ledger_id_occurred_on_idx
  on transactions (ledger_id, occurred_on desc);

-- 汇率缓存
create table if not exists exchange_rates (
  base_currency text not null,
  target_currency text not null,
  rate numeric not null,
  rate_date date not null,
  fetched_at timestamptz not null default now(),
  primary key (base_currency, target_currency, rate_date)
);

-- RLS：只有账本成员能读写自己账本的数据
alter table ledgers enable row level security;
alter table ledger_members enable row level security;
alter table transactions enable row level security;

-- 用 security definer 函数判断成员关系：owner 绕过 RLS，避免 ledger_members
-- 策略里自己查自己触发 "infinite recursion detected in policy" (42P17)
create or replace function public.is_ledger_member(p_ledger_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from ledger_members
    where ledger_id = p_ledger_id and user_id = auth.uid()
  );
$$;

drop policy if exists "members can read their ledger" on ledgers;
create policy "members can read their ledger" on ledgers
  for select using (is_ledger_member(id));

drop policy if exists "members can read their membership" on ledger_members;
create policy "members can read their membership" on ledger_members
  for select using (
    user_id = auth.uid() or is_ledger_member(ledger_id)
  );

drop policy if exists "members can CRUD their ledger's transactions" on transactions;
create policy "members can CRUD their ledger's transactions" on transactions
  for all using (is_ledger_member(ledger_id))
  with check (is_ledger_member(ledger_id));

-- exchange_rates 对所有登录用户只读，写入由前端服务角色隐式完成
alter table exchange_rates enable row level security;
drop policy if exists "authenticated users can read exchange rates" on exchange_rates;
create policy "authenticated users can read exchange rates" on exchange_rates
  for select using (auth.role() = 'authenticated');
drop policy if exists "authenticated users can insert exchange rates" on exchange_rates;
create policy "authenticated users can insert exchange rates" on exchange_rates
  for insert with check (auth.role() = 'authenticated');

-- 初始化一条账本记录（建表后手动执行一次即可）
-- insert into ledgers (name, base_currency) values ('我们的账本', 'CNY');

-- 把两个用户加入账本成员（拿到上面 insert 返回的 ledger id，以及在
-- Authentication -> Users 页面复制两个用户的 UUID 后替换下面的占位符）
-- insert into ledger_members (ledger_id, user_id, display_name) values
--   ('<ledger-id>', '<user-1-uuid>', '你'),
--   ('<ledger-id>', '<user-2-uuid>', '伴侣');
