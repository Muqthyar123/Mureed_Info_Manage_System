# 🕌 Mureed Information Management System (MIMS) — Frontend & Full-Stack Architecture

Welcome to the **Mureed Information Management System (MIMS)** frontend workspace. This repository houses the high-performance, responsive React application built to manage Mureed records, Peer information, multi-role authentication (Super Admin, Sub Admin, Mureed), and real-world database synchronization.

---

## 🌟 Key Features & Capabilities

- **Modern SaaS UI/UX**: Designed with React 18, Vite, TanStack Router (file-based SSR/CSR routing), TanStack Query, Tailwind CSS, and Shadcn UI.
- **Real-World Authentication & Security**:
  - Integrated with **Supabase Auth Cloud** and **FastAPI** backend for genuine JWT token issuance and verification.
  - Hashed password storage using **PBKDF2-HMAC-SHA256**.
  - Strict role-based access control (RBAC) across **Super Admin**, **Sub Admin**, and **Mureed** portals.
- **Real-Time Data Synchronization**:
  - Instant reflection of created, updated, or deleted Mureed records across Super Admin and Sub Admin dashboards.
  - Automatic recalculation of Age derived from Date of Birth.
  - Responsive pagination and search filtering handling large-scale database queries.
- **User Privacy & Sub Admin Scoping**:
  - Sub Admins can view and manage **Mureed accounts only**.
  - Sub Admins see their own email and Mureed emails in full, while Super Admin and peer Sub Admin emails are masked in `a********@company.com` format.
  - Cascading deletion: Deleting a Mureed automatically purges PostgreSQL database records and Supabase Auth credentials.
- **Transactional Email Delivery**:
  - Integrated with **Brevo Email API** for automated account setup and welcome emails.
- **Branding & Assets**:
  - Customized with high-resolution emblem logos (`logo.png`) and multi-format browser favicons (`favicon.ico`, `favicon.png`, `apple-touch-icon.png`).

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────┐
│              React 18 + Vite Frontend                   │
│   (TanStack Router, TanStack Query, Tailwind CSS, UI)   │
└────────────────────────────┬────────────────────────────┘
                             │ REST API (Bearer JWT)
┌────────────────────────────▼────────────────────────────┐
│                    FastAPI Backend                      │
│     (Python 3.13, Security, Mappers, Routers, Brevo)     │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               ▼                           ▼
 ┌───────────────────────────┐   ┌───────────────────────────┐
 │   Supabase PostgreSQL     │   │   Supabase Auth Cloud     │
 │ (mureeds, peers, users)   │   │  (JWT Tokens & Identity)  │
 └───────────────────────────┘   └───────────────────────────┘
```

---

## 👥 User Roles & Permissions Matrix

| Feature / Action                     | Super Admin | Sub Admin              | Mureed (Read-Only) |
| :----------------------------------- | :---------: | :--------------------: | :----------------: |
| **Login Portals**                    |     Yes     |          Yes           |        Yes         |
| **Admin Dashboard Statistics**       |     Yes     |          Yes           |         No         |
| **View Mureed Records**              |     Yes     |          Yes           |      Own Only      |
| **Add / Edit / Delete Mureeds**       |     Yes     |          Yes           |         No         |
| **Manage Peer Records**              |     Yes     |          Yes           |         No         |
| **Export Data (CSV / XLSX / PDF)**   |     Yes     |          Yes           |         No         |
| **Sub Admin Signup Approval**       |     Yes     |           No           |         No         |
| **User Account Management**          |     All     |     Mureeds Only       |         No         |
| **Email Privacy Masking**            | Full Access | Masked Non-Mureed Mail |      Own Only      |

---

## 📁 Directory Structure

```text
frontend_MIS/
├── public/
│   ├── logo.png                # Primary high-res emblem logo
│   ├── favicon.ico             # Browser tab ICO icon
│   ├── favicon.png             # Browser tab PNG icon
│   └── apple-touch-icon.png    # Mobile touch icon
├── src/
│   ├── components/
│   │   ├── auth/               # Auth forms & guarded routes
│   │   ├── common/             # Export menus & shared widgets
│   │   ├── forms/              # MureedForm, LoginForm, etc.
│   │   ├── layout/             # AppShell, Sidebar, TopNav, Header
│   │   └── ui/                 # Shadcn UI primitives (Button, Input, etc.)
│   ├── context/
│   │   └── AuthContext.tsx     # Global Auth Provider & state
│   ├── routes/
│   │   ├── __root.tsx          # Root HTML head & layout metadata
│   │   ├── login.tsx           # Role chooser portal
│   │   ├── admin-login.tsx     # Super Admin login
│   │   ├── sub-admin-login.tsx # Sub Admin login
│   │   ├── mureed-login.tsx    # Mureed login
│   │   ├── admin/              # Admin dashboard, mureeds, peers, users, reports
│   │   └── mureed/             # Mureed dashboard & My Information
│   ├── services/
│   │   ├── apiClient.ts        # Axios/Fetch HTTP client with JWT interceptor
│   │   ├── authService.ts      # Auth endpoints integration
│   │   ├── mureedService.ts    # Mureed CRUD endpoints integration
│   │   ├── peerService.ts      # Peer CRUD endpoints integration
│   │   └── userService.ts      # User management endpoints integration
│   ├── types/                  # TypeScript interfaces & schemas
│   └── utils/                  # Age calculation, formatting, CSV/XLSX export helpers
├── package.json
└── vite.config.ts
```

---

## ⚡ Quick Start & Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- Running instance of the **FastAPI Backend** (`http://127.0.0.1:8000`)

### 2. Environment Setup
Create a `.env` file in `frontend_MIS/`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### 3. Installation & Run
```bash
# Navigate to frontend folder
cd frontend_MIS

# Install dependencies
npm install

# Start local development server
npm run dev
```
The development server will run at `http://localhost:5173`.

### 4. Production Build
```bash
# Run typechecking and Vite production build
npm run build
```

---

## 🧪 Verification & Quality Control

- **Acceptance Testing**: Verified against backend script `run_real_world_acceptance_test.py` covering Super Admin login, Sub Admin approval flows, Mureed CRUD operations, and Supabase Auth token sync.
- **Production Build Status**: Verified clean build with 0 TypeScript/ESLint compilation errors.
