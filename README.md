# 🕌 Mureed Information Management System (MIMS)

> A modern, secure, full-stack enterprise information management application designed to manage Mureed records, Peer information, sub-admin approvals, transactional emails, and real-time database synchronization.

---

## 📸 System Overview & Branding

The **Mureed Information Management System (MIMS)** is a multi-role web platform supporting **Super Admin**, **Sub Admin**, and **Mureed** access levels. It replaces generic management tools with customized workflows, strict privacy protections, automated age calculations, and cloud database integration.

---

## 🚀 Key Features

### 🔐 1. Multi-Role Authentication & Security
- **Supabase Auth & FastAPI Security**: Genuine JWT token issuance and verification integrated with Supabase Auth Cloud.
- **Hashed Credentials**: Passwords stored using industry-standard **PBKDF2-HMAC-SHA256**.
- **Role Isolation**:
  - **Super Admin**: Full platform control, sub-admin approvals, system settings, user management.
  - **Sub Admin**: Managed Mureed records, Peer records, data exports, and Mureed account management.
  - **Mureed**: Personal read-only dashboard and profile access.

### 👥 2. Privacy & Sub Admin Scoping
- **Email Masking**: When Sub Admins view the User Management screen, non-Mureed admin emails are automatically masked (e.g., `a********@company.com`) while their own email and Mureed emails remain visible.
- **Mureed-Only Actions**: Sub Admins can only activate, deactivate, invite, or delete Mureed user accounts.
- **Cascading Deletion**: Deleting a Mureed record automatically deletes their PostgreSQL user account and revokes their Supabase Auth Cloud credentials.

### 📋 3. Mureed & Peer Record Management
- **Automatic Age Calculation**: Derived dynamically from Date of Birth (taking birthday month/day into account).
- **Sequential Unique ID Generation**: Collision-free IDs (`MRD-00001`, `mr-1`) calculated from maximum existing suffixes, eliminating primary key conflicts on record creation.
- **Multi-Format Export**: One-click download of Mureed and Peer lists in **CSV**, **XLSX**, and **PDF** formats.

### ✉️ 4. Transactional Emails
- Integrated with **Brevo Email API** to deliver welcome invitations and password setup links when new Mureed accounts are created.

---

## 🛠️ Technology Stack

| Layer                   | Technologies                                                                                |
| :---------------------- | :------------------------------------------------------------------------------------------ |
| **Frontend**            | React 18, Vite, TanStack Router, TanStack Query, Tailwind CSS, Shadcn UI, Lucide Icons      |
| **Backend**             | Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn                                  |
| **Database & Cloud**    | Supabase PostgreSQL Database, Supabase Auth Cloud (JWT & User Identity)                     |
| **Email Delivery**      | Brevo Transactional Email API                                                               |
| **Export Utilities**    | XLSX, jsPDF, jspdf-autotable, html2canvas                                                   |

---

## 📂 Repository Structure

```text
Mureed_Info_Manage_System(MIS)/
├── README.md                           # Master project documentation (this file)
│
├── backend_MIS/                            # FastAPI Python Backend Application
│   ├── app/
│   │   ├── main.py                     # FastAPI application factory & CORS setup
│   │   ├── config.py                   # Pydantic Settings & environment variables
│   │   ├── database.py                 # SQLAlchemy engine & session factory
│   │   ├── models.py                   # Database schemas (UserAccount, Mureed, Peer, etc.)
│   │   ├── schemas.py                  # Pydantic request/response validation schemas
│   │   ├── security.py                 # JWT token creation, decoding & dependencies
│   │   ├── supabase_auth.py            # Supabase Auth Cloud API client wrapper
│   │   ├── mappers.py                  # DTO mapper functions
│   │   ├── seed.py                     # Initial seed database handler
│   │   ├── routers/
│   │   │   ├── auth.py                 # Login, logout, signup & approval routes
│   │   │   ├── mureeds.py              # Mureed CRUD, export & invitation routes
│   │   │   ├── peers.py                # Peer CRUD & assignment routes
│   │   │   ├── users.py                # User management & status update routes
│   │   │   ├── reports.py              # Overview & analytics endpoints
│   │   │   └── exports.py              # Backend export helper endpoints
│   │   └── services/
│   │       └── email_service.py        # Brevo Transactional Email dispatcher
│   ├── scripts/
│   │   ├── run_real_world_acceptance_test.py # Automated full-stack acceptance test suite
│   │   └── process_app_logo_and_favicons.py  # Image processing utility for logo generation
│   ├── requirements.txt                # Python package dependencies
│   └── .env                            # Backend configuration & Supabase keys
│
└── frontend_MIS/                       # React + Vite Frontend Application
    ├── public/                         # App logo, favicons, static web assets
    ├── src/
    │   ├── components/                 # UI components, forms, layouts & tables
    │   ├── context/                    # AuthContext & React state hooks
    │   ├── routes/                     # TanStack Router page routes
    │   ├── services/                   # Frontend API client & endpoint services
    │   ├── types/                      # TypeScript definitions
    │   └── utils/                      # Export helpers, age calculator & validators
    ├── package.json                    # Node.js dependencies & build scripts
    └── README.md                       # Frontend-specific documentation
```

---

## ⚙️ Environment Configuration

### Backend Environment (`backend_MIS/.env`)

```env
MIMS_ENV=development
MIMS_DATABASE_URL=postgresql+psycopg2://postgres.<user>:<password>@<host>:5432/postgres?sslmode=require
MIMS_AUTH_BACKEND=supabase
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
MAIN_ADMIN_EMAIL=a********.admin@gmail.com
BREVO_API_KEY=<your-brevo-api-key>
BREVO_SENDER_MAIL=a********.admin@gmail.com
MIMS_FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081
```

### Frontend Environment (`frontend_MIS/.env`)

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python**: 3.11+ (Python 3.13 recommended)
- **Node.js**: 18+ and `npm` 9+
- **Supabase Account**: Live PostgreSQL connection string & Service Role Key

---

### 2. Backend Setup & Launch

```bash
# Navigate to backend directory
cd backend_MIS

# Create and activate virtual environment (optional but recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install psycopg2-binary

# Start the FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
API Documentation will be interactive at: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup & Launch

```bash
# Open a new terminal and navigate to frontend directory
cd frontend_MIS

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
The frontend application will launch at: `http://localhost:5173`

---

## 🧪 Testing & Verification

### Running Full-Stack Acceptance Tests

An automated real-world test suite is included in `backend_MIS/scripts/run_real_world_acceptance_test.py`. It tests:
1. Super Admin authentication & token generation.
2. Mureed account creation & age calculation.
3. Mureed login & route isolation.
4. Sub Admin signup, Super Admin approval, and permission restrictions.
5. Automatic cleanup of test data.

```bash
python backend_MIS/scripts/run_real_world_acceptance_test.py
```

### Production Build Verification

```bash
cd frontend_MIS
npm run build
```

---

## 📝 License

This project is developed for the **Mureed Information Management System (MIMS)**. All rights reserved.
