# 📸 Tandain

> **Modern Photo Selector & Instant RAW Matcher untuk Fotografer**  
> Solusi kurasi foto klien tanpa repot rekap chat manual dan tanpa perlu upload file RAW ke cloud.

---

## ⚡ Fitur Utama

- **Tanpa Upload Ulang:** Fotografer cukup menggunakan folder Google Drive publik yang sudah ada.
- **Pengalaman Klien Instan:** Klien memilih foto di HP tanpa perlu login/instal aplikasi (mendukung tap love ❤️, double-tap, dan Mode Swipe).
- **Auto-Ambil RAW di Laptop:** Menggunakan browser File System Access API untuk mencocokkan nama file pilihan klien dan otomatis menyalin file master RAW (`.CR3`, `.ARW`, `.NEF`, `.DNG`) dari harddisk/SD Card ke subfolder baru dalam 5 detik.
- **Integrasi Adobe Lightroom:** Format string filter siap pakai untuk ditempelkan ke Library Filter Lightroom Classic.
- **Bermerek Studio:** Nama dan branding studio fotografer terpampang di galeri klien.
- **Biaya Rp0:** Tanpa biaya langganan, tanpa sistem token per galeri.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript
- **Bundler:** Vite
- **Styling:** Pure Vanilla CSS (CSS Variables, Apple/iOS design tokens)
- **Icons:** Lucide React
- **Local Storage & Sync:** BroadcastChannel API & LocalStorage

---

## 🚀 Menjalankan Secara Lokal

1. **Clone repository:**
   ```bash
   git clone https://github.com/fajar-romadhan/tandain-app.git
   cd tandain-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npm run dev
   ```

4. **Build untuk production:**
   ```bash
   npm run build
   ```

---

## 📄 Lisensi

Distributed under the MIT License.
