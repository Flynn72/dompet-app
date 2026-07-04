-- ============================================================
-- SKEMA DATABASE "DOMPET" — jalankan di Supabase SQL Editor
-- Cara pakai: copy SEMUA isi file ini, paste ke SQL Editor
-- di dashboard Supabase, lalu klik tombol "Run".
-- ============================================================

-- 1. Tabel kategori (expense & saving) milik tiap user
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('expense', 'saving')),
  label text not null,
  color text not null default '#7FE8A4',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- 2. Tabel transaksi
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense', 'saving')),
  category_id uuid references public.categories(id) on delete set null,
  amount numeric not null check (amount > 0),
  note text default '',
  tx_date date not null,
  created_at timestamptz default now()
);

-- 3. Tabel budget per kategori per bulan
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  month_key text not null, -- format 'YYYY-MM'
  amount numeric not null default 0,
  created_at timestamptz default now(),
  unique (user_id, category_id, month_key)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — supaya tiap user HANYA bisa lihat
-- dan mengubah datanya sendiri. Ini bagian PALING PENTING
-- untuk memastikan data antar pengguna tidak bocor.
-- ============================================================

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- Kebijakan untuk categories
create policy "User hanya bisa lihat kategori miliknya sendiri"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "User hanya bisa tambah kategori untuk dirinya sendiri"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "User hanya bisa ubah kategori miliknya sendiri"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "User hanya bisa hapus kategori miliknya sendiri"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Kebijakan untuk transactions
create policy "User hanya bisa lihat transaksi miliknya sendiri"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "User hanya bisa tambah transaksi untuk dirinya sendiri"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "User hanya bisa ubah transaksi miliknya sendiri"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "User hanya bisa hapus transaksi miliknya sendiri"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Kebijakan untuk budgets
create policy "User hanya bisa lihat budget miliknya sendiri"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "User hanya bisa tambah budget untuk dirinya sendiri"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "User hanya bisa ubah budget miliknya sendiri"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "User hanya bisa hapus budget miliknya sendiri"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- ============================================================
-- FUNGSI: otomatis isi kategori default saat user baru daftar
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.categories (user_id, type, label, color, sort_order) values
    (new.id, 'expense', 'Pinjaman BRI', '#FF9466', 1),
    (new.id, 'expense', 'Wifi', '#6FB7E8', 2),
    (new.id, 'expense', 'Makan', '#F5C95D', 3),
    (new.id, 'expense', 'Bensin', '#E8C26F', 4),
    (new.id, 'expense', 'Service Motor', '#E89FC9', 5),
    (new.id, 'expense', 'Pulsa', '#C99FE8', 6),
    (new.id, 'expense', 'Paylater', '#E8846F', 7),
    (new.id, 'expense', 'Cicilan Laptop', '#6FE8D4', 8),
    (new.id, 'expense', 'BPJS KT sama KS', '#A8A89C', 9),
    (new.id, 'saving', 'Invest Emas di Peluang', '#F5C95D', 1),
    (new.id, 'saving', 'Invest Reksa Di Ajaib', '#7FE8A4', 2),
    (new.id, 'saving', 'Tabungan Kuliah/Dana Darurat', '#6FB7E8', 3);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SELESAI. Setelah ini berhasil dijalankan tanpa error,
-- lanjut ke langkah berikutnya (setup Authentication).
-- ============================================================
