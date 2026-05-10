## Admin Portal & Dashboard Implementation Plan

Build a separate admin experience with role-based access, global analytics, engine tuning, and false-positive control.

---

### 1. Database Changes (single migration)

**New enum & roles table** (security best-practice — never store roles on `profiles`):
- `app_role` enum: `'admin' | 'investigator'`
- `user_roles(id, user_id, role, created_at)` with unique `(user_id, role)`
- `has_role(_user_id uuid, _role app_role)` SECURITY DEFINER function
- `is_admin(_user_id uuid)` convenience wrapper
- RLS: users can read their own roles; only admins can insert/update/delete roles

**New `detection_config` table** (singleton row, admin-managed):
- `cycle_depth int default 4` (range 3–5)
- `fan_in_threshold int default 10`
- `shell_chain_length int default 3`
- `updated_at`, `updated_by`
- RLS: any authenticated user can SELECT (engine reads it); only admins can UPDATE/INSERT
- Seed one default row

**New `trusted_accounts` table** (global whitelist):
- `account_ref text unique`, `reason text`, `created_by uuid`, `created_at`
- RLS: any authenticated user can SELECT (engine reads it); only admins can INSERT/DELETE

**Expand RLS on existing tables for admin visibility:**
- Add admin SELECT policies on `analysis_uploads`, `accounts`, `fraud_rings`, `transactions`, `audit_logs` so admins can view all users' data globally (using `has_role(auth.uid(), 'admin')`).

---

### 2. Routing & Access Control

- Add routes in `src/App.tsx`:
  - `/admin/login` → `AdminLogin` page
  - `/admin/dashboard` → `AdminDashboard` page (wrapped in `AdminRoute`)
- Create `src/components/AdminRoute.tsx`: checks `useAuth()` session + queries `user_roles` for `admin`. Redirects non-admins to `/admin/login` (or `/dashboard` if already logged in as investigator).
- Create `src/hooks/useIsAdmin.ts` — reusable hook returning `{ isAdmin, loading }`.

---

### 3. Admin UI (distinct visual identity)

**Aesthetic:** keep dark forensic vibe but switch accent from green (investigator) to **amber/red** to clearly signal admin context. Add an "ADMIN" badge in the header and a different background pattern (subtle grid instead of hex).

**`AdminLogin` page** — minimal email/password form, Supabase auth, post-login admin role check; rejects non-admins with a clear error.

**`AdminDashboard` page** with Shadcn `Tabs`:

**Tab 1 — Overview**
- 3 metric cards (Lucide icons): Total Files Processed, Total Suspicious Accounts, Avg Processing Time (ms)
- Computed via aggregate queries on `analysis_uploads`
- Global Audit Table (`Table` component): columns = file_name, user_id (display_name from profiles), uploaded_at, transactions, suspicious, "View" button → links to `/dashboard?upload=<id>` (Investigator view, admin can see all data via new RLS policies)

**Tab 2 — Configuration**
- Three Shadcn `Slider` components with live value display:
  - Cycle Depth: 3–5
  - Fan-in Threshold: 2–50 (default 10)
  - Shell Chain Length: 2–10
- "Save Configuration" button → updates `detection_config`
- Show last-updated timestamp + updated_by

**Tab 3 — Trusted Accounts (Whitelist)**
- Input + "Add" button to add `account_ref` with optional reason
- Table listing all trusted accounts with delete (`Trash2`) icon per row
- Empty state guidance

---

### 4. Detection Engine Integration

- Update `supabase/functions/analyze-transactions/index.ts` to:
  - Read `detection_config` row at start of analysis (use values for cycle depth, fan-in threshold, shell chain length)
  - Read `trusted_accounts` and skip flagging any account in the set

---

### 5. Bootstrap First Admin

Since there's no existing admin, after migration approval I'll insert the current user as admin. The user can tell me their email or I'll add a small UI hint on `/admin/login` explaining they need to be promoted. **I'll insert an admin role for the currently signed-in user** (the project owner) using the `insert` tool after migration runs.

---

### Files to create
- `supabase/migrations/<timestamp>_admin_portal.sql`
- `src/hooks/useIsAdmin.ts`
- `src/components/AdminRoute.tsx`
- `src/pages/admin/AdminLogin.tsx`
- `src/pages/admin/AdminDashboard.tsx`
- `src/components/admin/AdminOverviewTab.tsx`
- `src/components/admin/AdminConfigTab.tsx`
- `src/components/admin/AdminWhitelistTab.tsx`
- `src/components/admin/AdminHeader.tsx`

### Files to edit
- `src/App.tsx` (add admin routes)
- `supabase/functions/analyze-transactions/index.ts` (read config + whitelist)

---

### Note on first admin
After you approve the migration, I'll need to know **which email** to promote to admin (likely yours). Reply with the email when approving, or I'll default to promoting the most recently signed-in account.
