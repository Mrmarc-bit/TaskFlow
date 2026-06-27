# ⚡ TaskFlow — Modern Task Management Workspace

<p align="center">
  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80" width="100%" alt="TaskFlow Banner" style="border-radius: 12px;" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=progressive-web-apps&logoColor=white" alt="PWA" />
</p>

**TaskFlow** adalah platform manajemen tugas (*Task Management*) modern berbasis **Progressive Web Application (PWA)** dengan arsitektur monorepo. Dibangun dengan fokus pada performa tinggi, UI/UX premium yang bersih, sinkronisasi real-time, dan analitik produktivitas yang dinamis.

---

## ✨ Fitur Utama

- 🎨 **Desain Landing Page Premium**: Landing page modern dengan gaya putih bersih, *sandbox* interaktif untuk uji coba fitur tanpa login, serta statistik real-time.
- 📋 **Interactive Kanban Board**: Manajemen tugas dengan fitur *drag-and-drop* yang mulus, subtask checklist, label prioritas, dan kategori tugas.
- ⚡ **Spotlight Command Palette (⌘K)**: Buka bar pencarian instan dari mana saja untuk navigasi halaman dan pencarian tugas secepat kilat.
- 📊 **Dynamic SVG Analytics**: Grafik tren produktivitas mingguan menggunakan SVG dinamis, diagram donat rasio penyelesaian tugas, dan break-down status.
- 🌗 **Premium Dark Mode**: Perpindahan tema gelap dan terang secara global yang konsisten, modern, dan nyaman di mata.
- 🔒 **Security & Authentication**: Dilengkapi perlindungan rute (*guards*), sistem role (*RBAC*), token rotasi (*refresh token rotation*), dan login demo instan.
- 📳 **PWA Capabilities**: Dukungan *Service Worker* yang andal untuk caching aset statis dan API offline.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework & Build Tool**: React 19 + Vite 8
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS + Framer Motion (untuk animasi transisi premium)
- **State & Data Fetching**: Zustand + TanStack Query (React Query)
- **Komponen UI**: Lucide Icons + custom responsive widgets

### Backend (Server)
- **Framework**: NestJS (Node.js)
- **Database ORM**: Prisma ORM
- **Database**: PostgreSQL / SQLite (Development)
- **Real-time**: WebSockets (Socket.io)
- **Dokumentasi**: Swagger Open-API (`/api/docs`)

---

## 📂 Struktur Folder Proyek

```bash
taskflow-ai/
├── apps/
│   ├── client/          # Aplikasi Frontend (React + Vite)
│   │   ├── public/      # PWA Manifest & Service Worker (sw.js)
│   │   └── src/         # Komponen UI, Pages, Store, & Fitur
│   └── server/          # Aplikasi Backend (NestJS + Prisma)
│       ├── prisma/      # Schema database dan Seed file
│       └── src/         # API Modules (Auth, Tasks, Analytics, Comments)
└── docker/              # Docker Compose untuk deployment lokal
```

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

### Prasyarat
- Node.js versi 18 ke atas
- npm atau yarn

### Langkah-langkah Instalasi

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/Mrmarc-bit/TaskFlow.git
   cd TaskFlow
   ```

2. **Setup Server (Backend)**:
   ```bash
   cd apps/server
   # Install dependensi
   npm install
   
   # Jalankan migrasi database & seed akun demo
   npx prisma migrate dev
   npx prisma db seed
   
   # Jalankan server dalam mode development
   npm run start:dev
   ```
   *Backend akan berjalan di `http://localhost:3000`.*
   *Dokumentasi API Swagger dapat diakses di `http://localhost:3000/api/docs`.*

3. **Setup Client (Frontend)**:
   Buka jendela terminal baru di root direktori project, lalu jalankan:
   ```bash
   cd apps/client
   # Install dependensi
   npm install
   
   # Jalankan client dalam mode development
   npm run dev
   ```
   *Frontend akan berjalan di `http://localhost:5173`.*

---

## 🔑 Akun Demo (Gunakan untuk Uji Coba)

Saat Anda berada di halaman Login, klik panel **Demo Credentials** di bagian bawah form untuk otomatis mengisi akun uji coba berikut:

| Peran (Role) | Email | Password |
|---|---|---|
| **Admin** | `admin@taskflow.dev` | `TaskFlowAdmin123!` |
| **Member** | `member@taskflow.dev` | `TaskFlowMember123!` |

---

## 📜 Lisensi

Proyek ini berada di bawah lisensi **MIT**. Anda bebas menggunakannya untuk tujuan pribadi maupun komersial.
