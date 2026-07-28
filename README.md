# Nexachain AI - MERN Stack MLM Investment & Admin Platform

This is a premium, full-featured implementation of the **Nexachain AI** platform. It features an Express.js API server (Node.js), MongoDB/Mongoose database models with compound unique indexing, JWT-based security middleware, robust MLM hierarchical traverse algorithms, automated daily interest schedules (with full idempotency safeguards), and a beautiful glassmorphic React dashboard supporting both client-facing and admin-specific viewports.

---

## 📂 Project Structure

```
/
├── backend/                  # Express API Server
│   ├── config/               # Database connection helper
│   ├── controllers/          # Business logic controllers (auth, admin, investments, etc.)
│   ├── middleware/           # Protect & isAdmin authentication guards
│   ├── models/               # Mongoose schemas (User, Investment, RoiHistory, ReferralIncome)
│   ├── routes/               # API Router directories (auth, admin, dashboard, referrals)
│   ├── services/             # Core ROI scheduler & Referral MLM traversal service
│   ├── scripts/              # Seed script (create-admin.js)
│   ├── tests/                # Automated API e2e & service integration tests
│   ├── .env.example          # Environment variables template
│   ├── server.js             # API entrypoint
│   └── package.json          # Server dependencies & scripts
│
└── frontend/                 # Vite + React Client
    ├── src/
    │   ├── App.jsx           # Core application frontend logic, routes & views
    │   ├── App.css           # Glassmorphism design system styles & Recharts components
    │   ├── main.jsx          # Client DOM mount
    │   └── index.css         # Styling reset
    ├── index.html            # Client entry & SEO metadata
    └── package.json          # Client dependencies & scripts
```

---

## 🛠️ Project Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) running locally on default port `27017`

### 1. Database & Seeding Setup
Before running the services, execute the administrative seed script to generate the default system administrator credentials in your local database:
Navigate to the `backend` folder:
```bash
cd backend
npm install
```
Run the seed script:
```bash
node scripts/create-admin.js
```
*Output confirm:*
```
=== Nexachain AI Admin Seeding Script ===
Connecting to database: mongodb://127.0.0.1:27017/nexachain
✅ ADMIN USER SEEDED SUCCESSFULLY!
Email: admin@nexachain.ai
Password: adminpassword
Role: admin
Referral Code: NEXAADMIN
```

### 2. Run API Server in Development (Nodemon)
Ensure your `.env` variables are configured (using `backend/.env.example` as a template):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/nexachain
JWT_SECRET=supersecretnexachainkey123
```
Launch the API server:
```bash
npm run dev
```
*(Listening on `http://localhost:5000`)*

### 3. Run React Frontend (Vite)
Navigate to the `frontend` directory:
```bash
cd ../frontend
npm install
npm run dev
```
*(Dashboard client loads on `http://localhost:5173`)*

---

## 🔑 Role-Based Navigation & UI Workflows

The application identifies the user's role (`'user'` or `'admin'`) upon successful authentication and loads a customized workspace view:

### 👤 Affiliate User Workspace
If logged in as a standard member, the sidebar exposes client-specific options:
- **Dashboard Overview**: Financial earnings summaries, wallet cards, active plan listings, and custom Recharts earnings diagrams.
- **My Investments**: Plan purchase selectors (`Basic` @ 1.0%/day, `Premium` @ 1.5%/day, `VIP` @ 2.0%/day) and maturity details.
- **Earnings Log**: Audit records of daily interest credits and network referral income.
- **Referral Network**: Clickable recursive **Referral Tree Visualizer** (up to 3 levels deep) and level 1 affiliate details.
- **Simulate Wallet Deposit**: Triggers a simulated **Razorpay Payment Gateway Overlay** offering UPI QR scanning (mock SVG generator) and card forms. Processing a payment executes a live credit call (`POST /api/investments/deposit`) to update the wallet balance.

### 🛡️ Dedicated Admin Workspace
If logged in as `admin@nexachain.ai`, the client-facing user menus are removed. The sidebar dynamically swaps to a customized administrative dashboard:
- **Affiliates Directory**: Management index displaying all registered affiliates, their total earnings, and an action button to **Suspend** or **Activate** accounts. Suspended accounts are locked out of endpoint requests and login attempts.
- **Capital Investments**: Inspect all global capital contracts and packages.
- **Ledger Audit Logs**: Transaction logs detailing global ROI yield distributions and level commission credits.
- **System Yield Controls**: Centralized controls to simulate target date cycles and trigger daily interest cron processing.

---

## 💡 Business Logic Specifications

### 1. MLM Commissions Traversal
When an active contract receives daily interest, the backend walks up the contract owner's upline chain up to 3 levels:
- **Level 1 Parent (Direct sponsor)**: Credited with **10%** of the child's daily interest.
- **Level 2 Parent**: Credited with **5%** of the child's daily interest.
- **Level 3 Parent**: Credited with **3%** of the child's daily interest.

*Note: Incomes are computed relative to the daily ROI yield. If a parent sponsor is suspended (`accountStatus === 'Suspended'`), they are skipped and receive no commissions.*

### 2. Idempotency Safeguards
- A compound unique index on the `RoiHistory` schema restricts `{ investment: 1, date: 1 }` where the date is normalized to midnight UTC (`YYYY-MM-DDT00:00:00.000Z`).
- An atomic database record write is executed. If a duplicate index hit is caught (code `11000`), the investment is skipped, preventing duplicate payments if the yield scheduler is executed multiple times in the same day.

---

## 📡 REST API Reference

### 🔐 Authentication

#### Register Affiliate User
- **Endpoint**: `POST /api/auth/register`
- **Body**: `{ "fullName", "email", "mobileNumber", "password", "referralCode" }`

#### User/Admin Login
- **Endpoint**: `POST /api/auth/login`
- **Body**: `{ "email", "password" }`

---

### 📈 Investments & Deposits

#### Purchase Investment Plan
- **Endpoint**: `POST /api/investments` (Protected - JWT Required)
- **Body**: `{ "amount": 1000, "planName": "VIP" }`

#### Simulate Deposit (Triggers via Razorpay Overlay)
- **Endpoint**: `POST /api/investments/deposit` (Protected - JWT Required)
- **Body**: `{ "amount": 2500 }`

---

### 🛡️ Administrative Controls (Requires Admin Role Guard)

#### Get Admin Dashboard stats & directories
- **Endpoint**: `GET /api/admin/dashboard-stats` (Protected - Admin JWT Required)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "totalUsers": 12,
        "totalPrincipal": 5000.00,
        "totalActivePrincipal": 4000.00,
        "totalRoiPaid": 120.00,
        "totalCommissionsPaid": 21.60
      },
      "users": [...],
      "investments": [...],
      "roiLogs": [...],
      "referralIncomes": [...]
    }
  }
  ```

#### Suspend / Activate User Account
- **Endpoint**: `POST /api/admin/toggle-user-status/:userId` (Protected - Admin JWT Required)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User account has been successfully suspended"
  }
  ```
