# Panduan Deployment: Freelancer Directory (Next.js + Cloudflare Pages + Turso)

Panduan ini akan membantu Anda mendaftar, menghubungkan database, dan mendeploy aplikasi ini ke Cloudflare Pages.

---

## Langkah 1: Persiapan Database (Turso)

Karena Anda sudah memiliki akun Turso, lakukan langkah berikut:

### 1.1 Dapatkan Kredensial Database
1. Buka [Dashboard Turso](https://turso.tech/).
2. Pilih database Anda.
3. Klik tombol **"Connect"** atau cari di bagian detail database.
4. Salin **Database URL** (contoh: `libsql://nama-db-anda.turso.io`).
5. Buat token baru jika belum ada, dan salin **Auth Token** tersebut.

### 1.2 Update Environment Local
Update file `.env.local` di folder project Anda dengan data yang barusan disalin:

```env
# Ganti dengan nilai asli dari dashboard Turso
TURSO_DATABASE_URL=libsql://freelancer-directory-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.3 Push Schema Database
Setelah `.env.local` diupdate, jalankan perintah ini di terminal VS Code untuk membuat tabel di database Turso:

```bash
npm run db:push
```

Jika berhasil, Anda akan melihat pesan sukses hijau.

---

## Langkah 2: Persiapan Kode (GitHub)

Pastikan kode Anda sudah dipush ke GitHub.

1. Buat repository baru di GitHub (jika belum).
2. Push kode Anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/username-anda/nama-repo-anda.git
   git push -u origin main
   ```

---

## Langkah 3: Deploy ke Cloudflare Pages

### 3.1 Setup Project di Cloudflare
1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Masuk ke menu **Workers & Pages** -> **Pages**.
3. Klik **Connect to Git**.
4. Pilih repository GitHub Anda (`freelancer-directory`).
5. Klik **Begin setup**.

### 3.2 Konfigurasi Build
Isi konfigurasi berikut:

*   **Project name**: `freelancer-directory` (atau sesuai keinginan)
*   **Production branch**: `main`
*   **vramework preset**: Pilih **Next.js (Static)** atau **Next.js** (Cloudflare akan mendeteksi otomatis, tapi kita setting manual agar aman).
    *   *Catatan:* Karena kita menggunakan `@cloudflare/next-on-pages`, pastikan settingan berikut:
    *   **Build command**: `npx @cloudflare/next-on-pages` (atau `npm run pages:build`)
    *   **Build output directory**: `.vercel/output/static`
    *   **Node.js Version**: Pastikan versi Node.js di setting (jika ada) minimal v18 atau v20. Biasanya otomatis.

### 3.3 Tambahkan Environment Variables
Di halaman setup yang sama, scroll ke bagian **Environment variables (advanced)** dan tambahkan:

| Variable Name | Value |
| :--- | :--- |
| `TURSO_DATABASE_URL` | `libsql://...` (sama seperti di .env.local) |
| `TURSO_AUTH_TOKEN` | `ey...` (sama seperti di .env.local) |
| `NODE_VERSION` | `20` (Optional, untuk memastikan versi node) |

### 3.4 Deploy!
Klik **Save and Deploy**. Cloudflare akan mulai membuild aplikasi Anda. Proses ini memakan waktu 1-3 menit.

---

## Langkah 4: Selesai!

Setelah build selesai, Cloudflare akan memberikan URL project Anda (contoh: `https://freelancer-directory.pages.dev`).

Buka URL tersebut dan coba fitur Register. Data akan langsung masuk ke database Turso Anda!
