# 🧠 PROJECT KNOWLEDGE & SESSION HANDOVER: TANDAIN (WEB-PILIHIN FOTO)

> **Dokumen ini adalah Single Source of Truth (SSOT) untuk status, arsitektur, catatan teknis, penanggulangan error, dan histori pekerjaan proyek Tandain.**  
> Dokumen ini dirancang agar agent selanjutnya dapat langsung melanjutkan pekerjaan tanpa kehilangan konteks.

---

## ⚡ QUICK TRIGGER PROTOCOL (STANDAR RESPON AGENT)

Jika user memberikan prompt berikut:

### 1. `cek update pekerjaan apa`
**Instruksi untuk Agent:**
1. Buka dan baca bagian **"📍 KONDISI TERAKHIR (STATUS SAAT INI)"** dan **"🚀 FITUR YANG SUDAH JALAN"** di file ini.
2. Berikan ringkasan cepat kepada user:
   - Progres terkini proyek
   - Status server lokal (port & URL)
   - Fitur apa saja yang sudah siap digunakan/diuji
   - Pekerjaan/task apa yang sedang menunggu feedback atau antrean berikutnya.

### 2. `catat pekerjaan di sesi ini`
**Instruksi untuk Agent:**
1. Kumpulkan seluruh aktivitas yang telah dikerjakan sejak perintah pertama di sesi berjalan.
2. Perbarui file `PROJECT_KNOWLEDGE.md` ini pada bagian:
   - **Histori Sesi**: Tambahkan blok log sesi baru (Tanggal, Jam, Ringkasan Perubahan, File yang disentuh).
   - **Error & Gotchas**: Catat error baru yang dihadapi dan cara penanggulangannya.
   - **Kondisi Terakhir**: Update status proyek ke kondisi paling mutakhir.
3. Konfirmasi kepada user bahwa seluruh catatan sesi telah tersimpan rapi di `PROJECT_KNOWLEDGE.md`.

---

## 📌 PROFIL & ARSITEKTUR PROYEK

- **Nama Proyek:** Tandain (Web Photo Selector & Auto RAW Matcher untuk Fotografer)
- **Target Pengguna:** Fotografer Indonesia (wedding, wisuda, photoshoot studio/outdoor) & klien foto mereka.
- **Problem Statement:** 
  - Klien biasa disuruh ketik manual puluhan nama file dari Google Drive di WhatsApp.
  - Fotografer pusing mencari satu per satu file RAW master di harddisk/kartu SD berdasarkan list teks klien.
  - Upload file RAW ke Google Drive mustahil karena ukuran bisa puluhan Gigabyte (boros kuota & cloud).
- **Solusi Tandain:**
  - **Klien:** Buka link tanpa login di HP/Laptop, pilih foto dengan tap hati ❤️ / double-tap / mode swipe, counter kuota otomatis, tombol kirim otomatis format WhatsApp ke FG.
  - **Fotografer:** Membuka dashboard di laptop via Chrome/Edge, klik "Ambil RAW dari Laptop", sistem memakai **File System Access API** (`showDirectoryPicker`) untuk memindai folder lokal master dan otomatis meng-copy file `.CR3`, `.ARW`, `.NEF`, `.DNG` yang dipilih klien ke subfolder baru dalam hitungan detik!
  - **Lightroom Helper:** Fitur copy filter string satu klik untuk paste langsung di Library Filter Lightroom Classic.
- **Biaya Operasional:** **Rp 0 (Nol Rupiah)** — Menggunakan storage client-side (IndexedDB / LocalStorage), local laptop file handling, dan Google Drive publik bawaan fotografer.

---

## 💻 ENVIRONMENT & CRITICAL GOTCHAS (PENTING DIBACA!)

Berikut adalah catatan lingkungan sistem dan error yang pernah terjadi beserta penanggulangannya agar **TIDAK TERULANG LAGI**:

### 1. Trailing Space pada Nama Direktori Workspace
- **Lokasi Workspace:** `/Users/macbook/WEB-PILIHIN FOTO ` (Perhatikan: ada **SPASI** di akhir nama folder!).
- **Error yang Terjadi:** Perintah terminal gagal dengan error `no such directory` jika path ditulis tanpa spasi akhir atau tidak di-escape.
- **Penanggulangan:** Selalu gunakan path dengan tanda petik atau sertakan spasi di akhir:  
  `"/Users/macbook/WEB-PILIHIN FOTO "`

### 2. Path Binary Node.js & npm
- **Kondisi Sistem:** Mesin Mac ini tidak menggunakan Homebrew default di PATH standar subshell, melainkan binary Node v22.14.0 & npm 10.9.2 yang terinstal di `$HOME/.local/bin`.
- **Error yang Terjadi:** `command not found: node` atau `npm`.
- **Penanggulangan:** Selalu sertakan export PATH di setiap eksekusi shell command:  
  ```bash
  export PATH="$HOME/.local/bin:$PATH" && <command>
  ```

### 3. TypeScript Strict Mode (`noUnusedLocals` & `noUnusedParameters`)
- **Kondisi:** `tsconfig.app.json` sangat ketat. Import atau variabel yang tidak digunakan akan langsung membatalkan build (`tsc -b` exit code 2).
- **Error yang Terjadi:** 16 compiler errors karena icon yang di-import dari `lucide-react` tidak terpakai, dan unused parameters pada callback.
- **Penanggulangan:**
  - Hapus semua unused imports sebelum build.
  - Untuk callback parameter yang wajib ada tapi tidak dipakai, berikan prefix underscore (contoh: `_event`).
  - Icon `Chrome` tidak tersedia di versi `lucide-react` yang terpasang, gunakan `Globe` atau icon netral lain.

### 4. Headless Browser (Playwright) Subagent Issue
- **Error yang Terjadi:** Subagent browser internal gagal inisialisasi karena download driver Playwright mac-arm64 menghasilkan CDN 404 (`playwright-1.57.0-mac-arm64.zip`).
- **Penanggulangan:** Jangan memaksakan retry Playwright jika CDN 404. Verifikasi server cukup via `curl -sI http://localhost:5173/` dan arahkan user untuk uji coba langsung di browser asli Mac/HP mereka.

### 5. Aturan Styling (CSS)
- **Constraint:** Vanilla CSS murni dengan CSS variables & tokens di `src/index.css`. **DILARANG** menggunakan TailwindCSS kecuali diminta eksplisit oleh user.

---

## 🚀 FITUR-FITUR YANG TELAH SELESAI DIBANGUN

| No | Modul / Komponen | Lokasi File | Deskripsi Fungsionalitas |
|---|---|---|---|
| 1 | **Design System iOS** | `src/index.css` | Token warna HSL/Hex soft (`#F5F5F7`, `#FF2D55`), blur backdrop, safe-area mobile insets, keyframes double-tap heart burst. |
| 2 | **Landing Page** | `src/components/LandingPage.tsx` | Presentasi produk modern, perbandingan workflow lama vs baru, CTA Coba Demo & Dashboard FG. |
| 3 | **Client Gallery** | `src/components/client/ClientGallery.tsx` | Tampilan klien responsif mobile/desktop, masonry multi-aspect grid, double-tap to like, filter (Semua / Dipilih), sticky counter bar. |
| 4 | **Lightbox Fullscreen** | `src/components/client/ClientLightbox.tsx` | Mode preview foto resolusi penuh, zoom in/out, keyboard arrow navigation, tap to like. |
| 5 | **Swipe Mode (Tinder-style)** | `src/components/client/ClientSwipeMode.tsx` | Mode pemilihan interaktif gestur geser (kanan = pilih, kiri = lewati), tombol aksi cepat, transisi kartu halus. |
| 6 | **Review & WA Generator** | `src/components/client/ClientReviewModal.tsx` | Modal tinjauan sebelum kirim, input nama & catatan, preview pesan WhatsApp terformat otomatis dengan direct link `https://wa.me/`. |
| 7 | **FG Dashboard** | `src/components/fg/FgDashboard.tsx` | Manajemen daftar proyek foto klien, pencarian cepat, ringkasan status kuota, navigasi ke detail proyek & profil studio. |
| 8 | **Auto RAW Matcher** | `src/components/fg/FgRawModal.tsx` & `src/services/rawMatcher.ts` | **Solusi RAW Laptop-First**: Memindai folder master lokal dengan `showDirectoryPicker`, mencocokkan nama file terpilih, dan otomatis meng-copy file `.CR3/.ARW/.NEF/.DNG` ke subfolder hasil. |
| 9 | **Lightroom Helper** | `src/components/fg/FgLightroomModal.tsx` & `src/services/lightroom.ts` | Generator string filter Lightroom Classic, export TXT & CSV filename list satu klik. |
| 10 | **New Project Wizard** | `src/components/fg/FgNewProjectModal.tsx` & `src/services/drive.ts` | Form input link Google Drive, ekstraksi ID folder otomatis, set kuota, watermark option, dan proteksi PIN opsional. |
| 11 | **Real-Time Event Bus** | `src/services/storage.ts` | Sinkronisasi multi-tab instan via `BroadcastChannel` (`tandain_realtime_bus`) & LocalStorage fallback. |

---

## 📍 KONDISI TERAKHIR (STATUS SAAT INI)

- **Tanggal & Waktu:** 2026-10-04, 23:20 WIB
- **Status Kompilasi:** `npm run build` PASS (0 Errors, 0 Warnings).
- **Status Server & Hosting Publik:**
  - **Public Online URL (Bisa diakses dari mana saja / HP teman):**  
    👉 `https://stephen-mls-invisible-charlotte.trycloudflare.com`
  - Localhost (Laptop): `http://localhost:5173/`
  - Local Network (WiFi lokal): `http://192.168.1.2:5173/`
- **Data Uji Coba Default:**
  - Proyek Wisuda Rani & Aditya (50 Kuota, 35 foto sample resolusi tinggi).
  - Proyek Pernikahan Dimas & Sarah.
- **Tahap Saat Ini:** Link publik sudah aktif dan bisa langsung dibagikan ke teman untuk pengujian langsung di HP/laptop mereka.

---

## 📝 HISTORI SESI PENGERJAAN

### Sesi 1 & 2 (Inisialisasi & Full Implementation) - 2026-10-04
1. **Analisis Kebutuhan & Riset:**
   - Diskusi skenario real fotografer (Drive JPEG -> Client pilih -> Matching file RAW di laptop).
   - Analisis kompetitor (Pilihin, Selecta, PilihKi) dan penetapan diferensiasi utama: fitur *Auto RAW Matcher laptop-first* tanpa upload cloud.
2. **Setup Environment:**
   - Deteksi ketiadaan Node.js sistem, download & setup manual Node.js v22.14.0 arm64 ke `~/.local/bin`.
   - Setup project Vite + React + TypeScript di workspace `/Users/macbook/WEB-PILIHIN FOTO `.
   - Install dependencies: `lucide-react`, `canvas-confetti`.
3. **Pembangunan Kode Sumber:**
   - Membuat model tipe data (`types/index.ts`).
   - Membuat modul storage real-time (`storage.ts`), parser Drive (`drive.ts`), RAW Matcher (`rawMatcher.ts`), dan Lightroom helper (`lightroom.ts`).
   - Membuat CSS tokens dan komponen UI lengkap untuk klien dan fotografer.
4. **Debugging & Testing:**
   - Memperbaiki trailing space path workspace pada shell command execution.
   - Mengatasi 16 TypeScript unused variable errors pada strict build mode.
   - Mengganti icon `Chrome` yang tidak ada menjadi `Globe`.
   - Menjalankan Vite dev server di port 5173 dan verifikasi status response HTTP 200 OK via curl.
### Sesi 4 (ATM Workflow Pilihin.app & Hapus Label Demo) - 2026-10-04, 23:14 WIB
- Menghapus seluruh floating dev switcher dan label "Demo" agar aplikasi 100% nyata dan profesional.
- Menerapkan prinsip ATM (Amati, Tiru, Modifikasi) dari standar industri `pilihin.app`:
  - **Hero Section**: Dua kolom (Copy + Interactive Galshot Mockup dengan nama studio, kuota, grid foto live tap-to-select, dan bar kirim pilihan).
  - **Call to Action**: Tombol utama *"Buat Galeri Seleksi"* langsung memicu form pembuatan galeri instan (tanpa login/biaya token).
  - **Section Masalah**: Visual chat WhatsApp yang berantakan ("kak no 12 ganti 15 ya") mengedukasi fotografer kenapa butuh Tandain.
  - **Stats & Fitur Unggulan**: Highlight 0 GB upload, 15 dtk siap bagi, dan keunggulan utama Tandain: *Auto-Salin RAW di laptop gratis*.
### Sesi 5 (Public Online Hosting via Cloudflare Tunnel) - 2026-10-04, 23:20 WIB
- Menginstall standalone binary `cloudflared` v2026.9.3 ke `$HOME/.local/bin/cloudflared`.
- Mengonfigurasi `server.allowedHosts: true` di `vite.config.ts` untuk mengatasi proteksi Host block Vite 6/8.
- Menjalankan Cloudflare Quick Tunnel daemon dengan sertifikat SSL/HTTPS resmi publik:
  - **Public Link:** `https://stephen-mls-invisible-charlotte.trycloudflare.com`
- Aplikasi sekarang dapat diakses secara publik oleh siapa saja (teman, klien, smartphone mana pun) dengan HMR aktif langsung dari laptop.
### Sesi 6 (GitHub Push & Repository Setup) - 2026-10-04, 23:23 WIB
- Membersihkan boilerplate tidak terpakai (`src/App.css`, `hero.png`, `.oxlintrc.json`, react/vite svg).
- Membuat `README.md` baru yang profesional, clean, dan informatif.
- Menginisialisasi Git lokal dan menghubungkan ke remote repository GitHub via SSH:
  - **Repo URL:** `https://github.com/fajar-romadhan/tandain-app`
- Push branch `main` sukses 100% (hanya file inti dan penting yang di-track).

---

## 🎯 DAFTAR RENCANA PENYEMPURNAAN BERIKUTNYA (BACKLOG)

1. [ ] **Feedback Uji Coba User:** Menyesuaikan UI/UX berdasarkan hasil coba langsung oleh user.
2. [ ] **Direct Google Drive API Integration (Opsional):** Penambahan pembacaan isi file langsung dari Google Drive Public Folder API tanpa perlu sample mock.
3. [ ] **Zip / Bundle Download (Opsional):** Pilihan untuk mendownload arsip list seleksi langsung jika diperlukan.
4. [ ] **PWA (Progressive Web App):** Menambahkan `manifest.json` dan service worker agar bisa di-install di Home Screen iPhone/Android seperti aplikasi native.
