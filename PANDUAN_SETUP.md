# Panduan Setup "Dompet" — Dari Nol Sampai Bisa Diakses Siapa Saja

Ikuti urutan ini dari atas ke bawah. Setiap langkah singkat, jangan lompat.

---

## BAGIAN 1 — Buat Project Supabase (database + login)

1. Buka https://supabase.com lalu klik **Start your project**
2. Daftar pakai akun GitHub atau email (gratis)
3. Setelah masuk dashboard, klik **New Project**
4. Isi:
   - **Name**: `dompet-app` (bebas)
   - **Database Password**: buat password kuat, **simpan baik-baik** di tempat aman (akan dipakai lagi)
   - **Region**: pilih `Southeast Asia (Singapore)` biar paling cepat dari Indonesia
5. Klik **Create new project**, tunggu 1-2 menit sampai project siap

---

## BAGIAN 2 — Jalankan Skema Database

1. Di dashboard Supabase, klik ikon **SQL Editor** di sidebar kiri (ikon `</>`)
2. Klik **New query**
3. Buka file `supabase_schema.sql` yang saya berikan, **copy SELURUH ISINYA**
4. Paste ke SQL Editor
5. Klik tombol **Run** (atau Ctrl+Enter)
6. Pastikan muncul tulisan **Success. No rows returned** — kalau ada tulisan merah/error, screenshot dan kirim ke saya

---

## BAGIAN 3 — Matikan Konfirmasi Email (karena kita pakai username, bukan email asli)

1. Di sidebar kiri halaman Authentication, cari grup **CONFIGURATION**
2. Di dalam grup itu, klik **Sign In / Providers**
3. Akan muncul daftar provider login (Email, Phone, dst). Klik baris **Email** untuk membuka detail pengaturannya — area pengaturan akan terbuka/meluas ke bawah
4. Di dalam area yang terbuka itu, cari opsi bernama **Confirm Email**, lalu **matikan togglenya** (posisi off)
5. Scroll ke bawah, klik tombol **Save**

> Ini penting karena sistem kita memetakan username jadi email palsu (`username@dompetapp.local`) di belakang layar — email itu tidak akan pernah menerima email asli, jadi konfirmasi email harus dimatikan supaya orang bisa langsung login setelah daftar.

---

## BAGIAN 4 — Ambil Kunci API

1. Di sidebar kiri, klik ikon gear **Project Settings**
2. Klik **API Keys** (di bawah grup CONFIGURATION)
3. Pastikan tab **"Publishable and secret API keys"** sedang aktif (biasanya sudah aktif secara default)
4. Di bagian **Publishable key**, cari baris bernama **default** — klik ikon **copy** (kotak kecil) di sebelah kanan nilai key untuk menyalinnya. Key ini formatnya diawali `sb_publishable_...`
5. Sekarang ambil **Project URL**: klik **General** di sidebar kiri (di atas "Compute and Disk"), lalu cari dan copy nilai **Project URL** (formatnya `https://xxxxx.supabase.co`)
6. Simpan kedua nilai tadi (Project URL dan Publishable key) sementara di Notepad

> Kalau di akun Supabase Anda ternyata tampilannya tidak ada tab "Publishable and secret API keys" dan langsung menampilkan tab **"Legacy anon, service_role API keys"**, klik tab tersebut dan copy nilai **anon public** (formatnya diawali `eyJ...`) sebagai gantinya — kode yang saya buat kompatibel dengan kedua jenis key ini.

> Sudah dapat Publishable key dari tab utama? **Abaikan tab "Legacy anon, service_role API keys"** sepenuhnya, tidak perlu dibuka atau dicopy apa pun dari sana — bahkan Supabase sendiri menyarankan memakai Publishable key dibanding anon key legacy ini. Kedua tab itu hanya dua cara berbeda untuk hal yang sama; cukup pakai salah satu.

> ⚠️ **PENTING — JANGAN PAKAI SECRET KEY**: baik di tab "Publishable and secret API keys" (bagian **Secret keys**, format `sb_secret_...`) maupun di tab Legacy (baris **service_role**, ditandai label merah "secret") — **abaikan keduanya sepenuhnya**, jangan copy, jangan tempel ke kode mana pun di project ini. Key jenis ini setara kunci master yang bisa melewati semua sistem keamanan database; kalau sampai tertanam di kode yang berjalan di browser, siapa saja yang membuka app bisa mengambilnya dan mengakses seluruh data semua pengguna. Project ini hanya didesain untuk memakai Publishable key (atau anon public untuk versi lama), tidak lebih dari itu.

---

## BAGIAN 5 — Masukkan Kunci ke Kode

1. Buka file `src/lib/supabaseClient.js` di project yang saya berikan
2. Cari baris ini:
   ```js
   const SUPABASE_URL = 'GANTI_DENGAN_PROJECT_URL_ANDA';
   const SUPABASE_ANON_KEY = 'GANTI_DENGAN_ANON_KEY_ANDA';
   ```
3. Ganti dengan nilai yang sudah dicopy dari Bagian 4. Contoh kalau dapat kunci format baru (publishable):
   ```js
   const SUPABASE_URL = 'https://xxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'sb_publishable_xxxxxxxxxxxxxxxx';
   ```
   Atau kalau dapat kunci format lama (anon):
   ```js
   const SUPABASE_URL = 'https://xxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
   ```
   Nama variabelnya tetap `SUPABASE_ANON_KEY` di kode meskipun nilainya kunci jenis publishable — ini hanya nama variabel, tidak memengaruhi cara kerjanya.
4. Simpan file

---

## BAGIAN 6 — Coba Jalankan di Komputer Dulu (opsional tapi disarankan)

Kalau Mas Surya punya Node.js terinstall di laptop:

```bash
cd dompet-app
npm install
npm run dev
```

Buka browser ke `http://localhost:5173`, coba daftar akun baru dan pastikan semua fitur jalan.

---

## BAGIAN 7 — Deploy ke Vercel (supaya jadi link yang bisa diakses semua orang)

1. Buka https://vercel.com, daftar pakai akun GitHub (gratis)
2. Upload folder project ini ke GitHub dulu:
   - Buat repository baru di https://github.com/new
   - Upload semua file project (bisa lewat GitHub Desktop atau drag-drop di web GitHub)
3. Di dashboard Vercel, klik **Add New** → **Project**
4. Pilih repository GitHub yang baru dibuat
5. Vercel akan otomatis mendeteksi ini project Vite — biarkan pengaturan default
6. Klik **Deploy**
7. Tunggu 1-2 menit, Vercel akan kasih link seperti `dompet-app-suryatri.vercel.app`

Link inilah yang bisa dibagikan ke siapa saja. Mereka tinggal buka link itu, daftar dengan username masing-masing, dan datanya otomatis terpisah dan aman (berkat sistem keamanan yang sudah diatur di database).

---

## Kalau Ada Kendala

Di setiap langkah, kalau ada pesan error atau bingung, screenshot saja dan kirim ke saya — saya bantu telusuri.