# TrendsBird E-Commerce Admin Dashboard (Frontend)

Production-ready, highly-polished e-commerce administration dashboard built with **Next.js 16 (App Router)**, **TypeScript**, **TailwindCSS**, and **Shadcn UI**.

Designed and implemented for the **Trends Bird Limited Developer Internship Assignment**. Fully exercises all 9 backend core REST modules with granular permission access control, URL-synced server pagination & search, interactive media picker, multi-depth category trees, color/image swatch pickers, and product variant matrix generation.

---

## 🚀 Quick Start

### 1. Environment Setup
Create a `.env.local` file in the root directory (or copy `.env.example`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🔑 Seeded Test Account Credentials

| Account Role | Email Credentials | Password | Permissions Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@trendsbird.com` | `SuperAdmin123!` | All permissions (`*:watch`, `*:create`, `*:update`, `*:delete`) |
| **Catalog Limited Manager** | `catalog@trendsbird.com` | `Catalog123!` | Limited catalog access (`category:*`, `brand:*`, `attribute:*`, `product:*`). Has NO access to `user:*`, `role:*`, `permission:*` screens (triggers 403 Forbidden UI guards). |

---

## 🔒 Authentication & Token Strategy

- **Dual-Token System**: Short-lived JWT Access Token (15 mins) and long-lived Refresh Token.
- **Transparent Rotation & Retry**: Built with a single in-flight promise queue interceptor in Axios (`src/lib/api/client.ts`). When an access token expires (401), the frontend automatically requests a new token pair and retries the failed request seamlessly without interrupting user actions.
- **Session Persistence**: User details and permissions are populated via `/auth/session` on page load and stored in `useSessionStore` (Zustand).
- **True Logout**: Logging out triggers `/auth/logout` to revoke the refresh token server-side before wiping client state.

---

## 📊 Module Implementation Status

| # | Module | Status | Frontend Highlights |
| :-: | :--- | :-: | :--- |
| **1** | **Authentication** | ✅ **Complete** | Sign-in, unified error for bad credentials, auto-session hydration, refresh token rotation, true server-side logout. |
| **2** | **Permission** | ✅ **Complete** | Module $\times$ Action permissions grid, custom action generator, search & pagination. |
| **3** | **Role** | ✅ **Complete** | Permission matrix editor, Grant-All administrator shortcut, `userCount` badge, backend deletion guards. |
| **4** | **User** | ✅ **Complete** | Required role selector (no pre-selected default), password omitted on edit, active toggle, self-escalation guard. |
| **5** | **Media** | ✅ **Complete** | Axios per-file upload progress bar, MIME allow-list pre-check, thumbnail grid, metadata editor, reusable `MediaPicker` modal. |
| **6** | **Category** | ✅ **Complete** | Unlimited-depth collapsible tree view, Tree/Table toggle, client-side parent cycle guard, `MediaPicker` banner attachment. |
| **7** | **Brand** | ✅ **Complete** | `MediaPicker` logo attachment, status filter, product reference deletion guard. |
| **8** | **Attribute** | ✅ **Complete** | `DROPDOWN`, `RADIO`, `CHECKBOX`, `COLOR_SWATCH` (with `react-colorful` Hex picker), `IMAGE_SWATCH` (with `MediaPicker`), inline value CRUD. |
| **9** | **Product** | ✅ **Complete** | Simple vs Variable product discriminated forms, `@dnd-kit` sortable gallery reordering, single-thumbnail enforcement, Cartesian variant matrix generator, duplicate SKU & combination guards. |

---

## 🛠️ Tech Stack & Key Libraries

- **Framework**: Next.js 16 (App Router)
- **State & Data Fetching**: `@tanstack/react-query`, `zustand`, `nuqs` (URL query state syncing)
- **Forms & Validation**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Color Picker**: `react-colorful`
- **Icons & UI Components**: `lucide-react`, `@base-ui/react`, Radix UI primitives
