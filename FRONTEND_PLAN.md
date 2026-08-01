# Trends Bird — Admin Dashboard Frontend Plan

Companion frontend for the completed `trendsbird-backend` (Express + TypeScript + Prisma +
PostgreSQL, cookie-based JWT auth). This document is the build spec: setup, stack, folder
structure, and the exact sequence to build in.

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack default) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Server state / caching | @tanstack/react-query |
| Client/global state | zustand (session: user, role, permissions) |
| Forms | react-hook-form + zod + @hookform/resolvers |
| HTTP client | axios (cookie-based, single-flight refresh interceptor) |
| Tables | @tanstack/react-table (wrapped as a shared DataTable) |
| URL state (search/filter/page) | nuqs |
| Toasts | sonner |
| Drag-and-drop (gallery reorder) | @dnd-kit/core + @dnd-kit/sortable |
| Colour picker (attribute values) | react-colorful |
| Icons | lucide-react (comes with shadcn) |

---

## 2. Backend Contract Summary (what the frontend must match)

- **Base URL**: `http://localhost:5000/api/v1` (backend `PORT=5000`, expects
  `FRONTEND_URL=http://localhost:3000` for CORS).
- **Auth**: httpOnly cookies (`accessToken`, `refreshToken`), `SameSite=Lax`. Every request must
  be sent with `credentials: 'include'` (axios: `withCredentials: true`). No manual token storage
  needed on the client.
- **Response envelope** (always unwrap this in the API layer, never consume raw axios responses
  in components):
  ```
  { success: boolean, message: string, data?: T, meta?: {...}, error?: { code, details } }
  ```
- **Session**: `GET /auth/session` → `{ user, role, permissions: string[] }`. This is the single
  source of truth for the sidebar, route guards, and per-action permission checks.
- **Refresh**: `POST /auth/refresh` — cookie-driven, rotates both tokens. Must be called with a
  single in-flight promise so concurrent 401s don't fire multiple refreshes.
- **Permissions** are `module:action` strings (e.g. `product:create`). `watch` = can see the
  sidebar entry / open the screen. `read` = can fetch records. Sidebar visibility is driven by
  `watch`, not `read`.
- **Product create/update is a discriminated union** on `hasVariants` (`true`/`false`) — the form
  must switch schema and payload shape, not just hide fields.
- Seeded accounts (for manual testing of 403s):
  - `admin@trendsbird.com` / `Password123!` — super admin, all permissions.
  - `catalog@trendsbird.com` / `Password123!` — catalog-only, no permission/role/user access.

---

## 3. Environment Variables (frontend)

`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## 4. Folder Structure

```
trendsbird-frontend/
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  └─ login/
│  │  │     └─ page.tsx
│  │  ├─ (dashboard)/
│  │  │  ├─ layout.tsx                 # sidebar + topbar + auth guard
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ permissions/page.tsx
│  │  │  ├─ roles/
│  │  │  │  ├─ page.tsx
│  │  │  │  └─ [id]/page.tsx
│  │  │  ├─ users/page.tsx
│  │  │  ├─ media/page.tsx
│  │  │  ├─ categories/page.tsx
│  │  │  ├─ brands/page.tsx
│  │  │  ├─ attributes/page.tsx
│  │  │  └─ products/
│  │  │     ├─ page.tsx
│  │  │     ├─ new/page.tsx
│  │  │     └─ [id]/page.tsx
│  │  ├─ layout.tsx                    # root layout: providers
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ ui/                           # shadcn generated components
│  │  ├─ shared/
│  │  │  ├─ data-table.tsx
│  │  │  ├─ can.tsx                    # <Can I="product:create">...</Can>
│  │  │  ├─ confirm-dialog.tsx
│  │  │  ├─ media-picker.tsx
│  │  │  ├─ status-badge.tsx
│  │  │  ├─ page-header.tsx
│  │  │  └─ empty-state.tsx
│  │  └─ modules/
│  │     ├─ permission/  (group-form, action-checkboxes)
│  │     ├─ role/        (role-form, permission-grid)
│  │     ├─ user/        (user-form)
│  │     ├─ media/       (upload-dropzone, media-grid)
│  │     ├─ category/    (category-tree, category-form)
│  │     ├─ brand/       (brand-form)
│  │     ├─ attribute/   (attribute-form, value-list, colour-picker)
│  │     └─ product/     (product-form-tabs, variant-generator, gallery-sortable)
│  ├─ lib/
│  │  ├─ api/
│  │  │  ├─ client.ts                  # axios instance + refresh interceptor
│  │  │  ├─ auth.ts
│  │  │  ├─ permission.ts
│  │  │  ├─ role.ts
│  │  │  ├─ user.ts
│  │  │  ├─ media.ts
│  │  │  ├─ category.ts
│  │  │  ├─ brand.ts
│  │  │  ├─ attribute.ts
│  │  │  └─ product.ts
│  │  ├─ stores/
│  │  │  └─ session-store.ts           # zustand: user, role, permissions
│  │  ├─ hooks/
│  │  │  ├─ use-permission.ts
│  │  │  └─ use-session.ts             # react-query wrapper around /auth/session
│  │  ├─ schemas/                      # zod schemas mirroring backend validation
│  │  │  ├─ auth.schema.ts
│  │  │  ├─ role.schema.ts
│  │  │  ├─ user.schema.ts
│  │  │  ├─ category.schema.ts
│  │  │  ├─ brand.schema.ts
│  │  │  ├─ attribute.schema.ts
│  │  │  └─ product.schema.ts
│  │  └─ utils.ts
│  └─ types/
│     └─ index.ts                      # shared TS interfaces mirroring backend DTOs
├─ .env.local
├─ .env.example
├─ tailwind.config.ts
├─ components.json                     # shadcn config
├─ next.config.ts
└─ package.json
```

---

## 5. Build Sequence

Follow the backend's own module order — Product depends on nearly everything before it, and
building out of order means rework.

1. **Project scaffold** — Next.js + Tailwind + shadcn init, install all libraries, set up folder
   structure, `.env.local`.
2. **API client + auth** — axios instance with `withCredentials: true`, response interceptor with
   single-flight 401→refresh→retry, `lib/api/auth.ts`. Login page, session restore on app load,
   logout. Verify this works end-to-end against the real backend before moving on.
3. **Session store + permission hook** — zustand store populated from `/auth/session`;
   `usePermission('product:create')` hook; `<Can>` component.
4. **Dashboard shell** — protected layout, sidebar driven by `watch` permissions, topbar with
   user/role and logout, 403/empty/loading state patterns shared across all screens.
5. **Shared components** — `DataTable` (server-driven pagination/search/filter via `nuqs`),
   `ConfirmDialog`, form Sheet/Dialog pattern, `StatusBadge`. Build these once, reuse for every
   module below.
6. **Permission module** — group list (search + pagination), create group with action checkboxes,
   custom permission name, edit group, add/remove actions, delete group.
7. **Role module** — list with user counts, create/edit with module×action grid (pre-ticked on
   edit), grant-all shortcut, add/remove individual permissions, delete-blocked-while-in-use
   handling.
8. **User module** — list with role/status filters + search, create/edit with required role select,
   activate/deactivate, delete, self-escalation error handling.
9. **Media module** — multi-file upload with progress and per-file error states, grid view with
   thumbnails and type filter, metadata edit (alt text/title), delete. Build `MediaPicker` here —
   it's reused by Category, Brand, and Product.
10. **Category module** — tree view (and flat list), parent picker fed by the tree, image via
    `MediaPicker`, cycle-rejection error handling, delete-blocked-while-children-or-products
    handling.
11. **Brand module** — simplest CRUD screen, logo via `MediaPicker`, status filter,
    delete-blocked-while-referenced handling.
12. **Attribute module** — type selector (dropdown/radio/checkbox/colour swatch/image swatch),
    inline value add/edit/remove, colour picker for colour-type values, delete-blocked-while-used
    handling.
13. **Product module (largest)** — tabbed form:
    - Details tab (name, slug, descriptions, weight, active/featured/sort order)
    - Brand & Categories tab
    - Media tab (`MediaPicker`, exactly-one-thumbnail enforcement, gallery reorder via dnd-kit)
    - Variants tab (attribute/value picker → generate combinations → per-variant SKU/price/stock/
      media, only shown when `hasVariants = true`)

    Plus: product list with thumbnail/brand/categories/price-or-range/status columns, search by
    name or SKU, filters for category/brand/status, sorting.
14. **Pass over all screens**: loading/empty/error states present everywhere, field-level API
    validation errors mapped onto form fields, 403s show a clear message (not a blank screen),
    verify with the `catalog@trendsbird.com` account that restricted actions are hidden in the UI
    (and confirm via Postman separately that the backend still blocks them).

---

## 6. Project Setup Instructions (for Antigravity IDE)

Run in order:

```bash
# 0. Confirm Node.js 20+ (Next.js 16 minimum requirement)
node -v

# 1. Scaffold Next.js project (pulls current stable — Next.js 16.x)
npx create-next-app@latest trendsbird-frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd trendsbird-frontend

# 2. Initialize shadcn/ui
npx shadcn@latest init

# Recommended shadcn init answers:
#   Style: New York (or Default — either is fine, design isn't graded)
#   Base color: Slate
#   CSS variables: Yes

# 3. Add the shadcn components we'll need across all screens
npx shadcn@latest add button input label select checkbox switch table dialog sheet dropdown-menu \
  form textarea badge avatar separator tabs card skeleton tooltip popover command \
  alert-dialog scroll-area pagination sonner breadcrumb

# 4. Install data/state/form libraries
npm install @tanstack/react-query @tanstack/react-table zustand axios \
  react-hook-form @hookform/resolvers zod nuqs sonner \
  @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-colorful

# 5. Create the working folders
mkdir -p src/lib/api src/lib/stores src/lib/hooks src/lib/schemas src/types
mkdir -p src/components/shared src/components/modules/{permission,role,user,media,category,brand,attribute,product}
mkdir -p "src/app/(auth)/login" "src/app/(dashboard)/dashboard" "src/app/(dashboard)/permissions" \
  "src/app/(dashboard)/roles/[id]" "src/app/(dashboard)/users" "src/app/(dashboard)/media" \
  "src/app/(dashboard)/categories" "src/app/(dashboard)/brands" "src/app/(dashboard)/attributes" \
  "src/app/(dashboard)/products/new" "src/app/(dashboard)/products/[id]"

# 6. Environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
EOF
cp .env.local .env.example

# 7. Run the backend (separate terminal, from trendsbird-backend/)
#    npm install && npx prisma migrate dev && npx prisma db seed && npm run dev
#    Backend must be running on :5000 with FRONTEND_URL=http://localhost:3000 in its .env

# 8. Start the frontend dev server
npm run dev
# App runs on http://localhost:3000
```

**Before writing any screen code**: confirm `POST http://localhost:5000/api/v1/auth/login` works
from the browser with `credentials: 'include'` and that the `accessToken`/`refreshToken` cookies
are visible in DevTools → Application → Cookies for `localhost`. If cookies aren't set, check the
backend's `COOKIE_DOMAIN` and `FRONTEND_URL` env values before touching any React code.

---

## 7. Definition of Done (per module, tied to grading criteria)

For every module: full CRUD works through the UI **and** every mutating action is hidden/disabled
when the logged-in user lacks the permission (verified against `catalog@trendsbird.com`), loading/
empty/error states exist, pagination/search/filters call the API (not client-side filtering), and
API validation errors surface on the correct form field.
