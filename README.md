# 🛡️ AllergyGuard — Food Allergy-Safe Meal Planner

AllergyGuard is a full-stack, enterprise-grade food allergy-safe meal planner. It helps daycares, schools, and care centers manage children's food allergies, dynamically check daily menus, manage meal assignments safely, track parent request updates, and compile daily safety digest reports with real-time alert mechanisms.

---

## 🚀 Key Features

1. **Dashboard & Alert Center**: Quick stats on active warnings, high-risk children, and a real-time feed of allergy-related menu conflicts.
2. **Children Directory**: Easily add children, select age limits (restricted to 10 and under), and register custom allergens with color-coded severity risk levels (Low, Medium, High).
3. **Smart Meal Calendar**: A weekly Mon–Fri grid view for Breakfast, Lunch, and Snack. Instantly colors cards based on menu safety:
   - 🟢 **Safe**: No allergen conflicts.
   - 🟡 **Warning**: Matches medium/low severity allergens.
   - 🔴 **Blocked**: Matches high-risk allergens.
   - Allows duplicating calendars across classrooms with the "Copy This Week" utility.
4. **Allergy Analytics Dashboard**: Visualizations of allergy distributions, classroom breakdown, enrollment-to-risk line graphs, and weekly meal safety reports (Print/PDF export ready).
5. **Parent Portal**: Parent account view with child profile dashboard, today's meal safety checklist, and allergy update request submissions.
6. **Parent Requests Review**: Admin control center to approve/reject parent submitted allergy profile modifications.
7. **Daily Digest**: Print-friendly daily summaries, severity breakdowns, and full logs of critical events.
8. **Real-time Push Notifications**: Instant native browser alert notifications for new allergen-menu warnings.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19 (TypeScript), Vite, Tailwind CSS v4, Recharts, Lucide Icons, html2canvas, jsPDF.
- **Backend**: Express.js (Node.js), CORS, Helmet (Security headers), Express Validator (Validation), Express Rate Limit.
- **Database**: PostgreSQL (`pg` client) with an **automatic in-memory fallback mock** database, ensuring the application runs out-of-the-box even without a live Postgres instance!

---

## 📂 Project Structure

```
├── .github/workflows/   # CI/CD Workflows
│   └── ci.yml           # Runs on push/PR (builds frontend, tests backend)
├── backend/             # Express API Server
│   ├── __tests__/       # Backend Integration & Unit Tests
│   ├── middleware/      # Auth & error handling middlewares
│   ├── models/          # PostgreSQL database config & in-memory mocks
│   ├── routes/          # REST Endpoint handlers (Analytics, Auth, Children, Meals)
│   ├── utils/           # Allergen Engine check algorithms
│   ├── package.json     # Node script configuration
│   └── server.js        # Main API entrypoint
├── src/                 # React Frontend
│   ├── components/      # UI components (Sidebar, Navbar, Modals)
│   ├── hooks/           # Custom hooks (toast, etc.)
│   ├── pages/           # Pages (Dashboard, Analytics, ParentPortal, Digest)
│   ├── services/        # Service layer (API axios client)
│   ├── App.tsx          # Client routing & layout rules
│   └── main.tsx         # App mount point
├── package.json         # Workspace/Root configurations
└── vite.config.ts       # Vite build configurations
```

---

## ⚙️ Local Development Setup

To run both the frontend and the backend locally:

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Install Dependencies
Run the following command in the **root directory** to install dependencies for both the frontend and backend (via the auto-postinstall hook):
```bash
npm install
```

### 3. Start Development Servers
1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
2. Start the frontend Vite dev server (in a separate terminal):
   ```bash
   npm run dev
   ```
Now open your browser to [http://localhost:5173](http://localhost:5173) to see the app!

### 4. Running Tests
You can verify the backend endpoints and allergen logic by running:
```bash
cd backend
npm test
```

---

## ☁️ Deployment Guide

### Option 1: Full-Stack Deployment to Render / Heroku / Railway (Recommended)
This repository is pre-configured to be deployed as a **single, unified full-stack application**. 

1. **Vite Build**: When deployed, the platform will automatically trigger `npm run build` which compiles the React frontend assets into the `dist/` directory.
2. **Unified Express Server**: The backend Express server is configured to serve the static frontend assets from `dist/` when `NODE_ENV=production` is set.
3. **Environment Variables**:
   - `NODE_ENV`: Set to `production`
   - `PORT`: (Automatically set by the platform)
   - `DATABASE_URL`: Add your PostgreSQL connection URI (if using a database; if left blank, the app gracefully falls back to the in-memory mock store).
4. **Build & Start Commands on Render**:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start` (runs `node backend/server.js`)

### Option 2: Frontend Static Deployment (GitHub Pages)
If you only want to deploy the static frontend to GitHub Pages:
1. In `vite.config.ts`, add `base: '/<your-repository-name>/'` to configure the public assets path.
2. Set up the GitHub Pages deployment action or use the `gh-pages` npm utility.
3. Note: Since GitHub Pages is static-only, client-side routing may require switching `BrowserRouter` to `HashRouter` inside `src/App.tsx` to handle page reloads without 404 errors.
