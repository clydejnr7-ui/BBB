-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  credits integer default 3 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Generated sites table
create table if not exists public.generated_sites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  style text not null,
  html_code text not null,
  preview_slug text unique not null,
  credits_used integer default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payments table
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount_usd numeric(10, 2) not null,
  credits_purchased integer not null,
  nowpayments_payment_id text,
  status text default 'pending' not null check (status in ('pending', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_generated_sites_user_id on public.generated_sites(user_id);
create index if not exists idx_generated_sites_preview_slug on public.generated_sites(preview_slug);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_nowpayments_id on public.payments(nowpayments_payment_id);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.generated_sites enable row level security;
alter table public.payments enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Generated sites policies
create policy "Users can view own sites"
  on public.generated_sites for select
  using (auth.uid() = user_id);

create policy "Users can insert own sites"
  on public.generated_sites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own sites"
  on public.generated_sites for delete
  using (auth.uid() = user_id);

-- Payments policies
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, credits)
  values (new.id, 3);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Public access for preview (read-only for preview_slug lookup)
create policy "Anyone can view site previews by slug"
  on public.generated_sites for select
  using (true);
