# 🤖 AGENT RULES & OPERATING PROCEDURES: TANDAIN

Setiap agent AI yang bekerja di workspace ini **WAJIB** membaca dan mematuhi panduan ini.

---

## ⚡ SPECIAL USER COMMAND TRIGGERS

Apabila user memberikan salah satu dari prompt berikut, tanggapi sesuai prosedur di bawah:

### 1. `cek update pekerjaan apa`
1. Buka dan baca file [`PROJECT_KNOWLEDGE.md`](./PROJECT_KNOWLEDGE.md).
2. Laporkan secara detail dan terstruktur kepada user:
   - Status pengerjaan proyek saat ini (tahap mana yang sudah selesai).
   - Status server lokal (port & link localhost / WiFi).
   - Fitur-fitur utama yang siap diuji.
   - Hal-hal yang sedang menunggu feedback atau langkah selanjutnya.

### 2. `catat pekerjaan di sesi ini`
1. Kumpulkan seluruh histori pengerjaan dari perintah pertama di sesi tersebut.
2. Buka file [`PROJECT_KNOWLEDGE.md`](./PROJECT_KNOWLEDGE.md).
3. Perbarui bagian:
   - **Histori Sesi Pengerjaan**: Tambahkan log sesi baru dengan tanggal, jam, detail perubahan, dan file yang disentuh.
   - **Environment & Critical Gotchas**: Jika menemukan error baru (misal: compiler, library, OS, atau browser), catat error dan solusinya di sini.
   - **Kondisi Terakhir**: Update status proyek terkini.
4. Berikan konfirmasi singkat dan rapi kepada user bahwa pencatatan telah selesai disimpan.

---

## ⚠️ CRITICAL TECHNICAL CONSTRAINTS

1. **Workspace Path Trailing Space:**
   - Direktori root memiliki trailing space: `"/Users/macbook/WEB-PILIHIN FOTO "`.
   - Pastikan path selalu dibungkus tanda kutip agar tidak menghasilkan `no such directory`.
2. **Node.js & npm Path:**
   - Node v22.14.0 dan npm terinstal di `$HOME/.local/bin`.
   - Selalu jalankan perintah terminal dengan: `export PATH="$HOME/.local/bin:$PATH" && <command>`.
3. **TypeScript Strict Mode:**
   - `noUnusedLocals` dan `noUnusedParameters` aktif. Dilarang meninggalkan import atau variabel yang tidak digunakan. Prefix `_` untuk parameter fungsi yang tidak terpakai.
4. **Design & Styling:**
   - Gunakan **Pure Vanilla CSS** dengan token yang sudah ada di `src/index.css`. Jangan gunakan TailwindCSS.
5. **Headless Browser / Playwright:**
   - Jika Playwright driver mac-arm64 CDN 404, jangan retry terus-menerus. Cukup verifikasi via curl atau arahkan user membuka browser asli di laptop/HP.
