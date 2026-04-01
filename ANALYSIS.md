# REX — Repository Analysis & Roadmap

## 1. Architecture Overview

REX is a **BYODB (Bring Your Own Database) desktop project-management platform** built on a three-tier architecture:

| Layer | Technology |
|---|---|
| Desktop shell | Electron (wraps the frontend and spawns the backend binary) |
| Frontend | React 18 + TypeScript + Vite · Zustand · Tailwind CSS · Recharts · Three.js |
| Backend | Go 1.24 + Fiber v2 (HTTP + WebSocket) · GORM · JWT |
| Database | PostgreSQL (primary) or SQLite (local/dev fallback) |

The Electron `main.cjs` launches the Go binary as a child process and serves the compiled React
app, so the entire product ships as a **single self-contained `.deb` / `AppImage`**.

---

## 2. Tech Stack in Use

- **Go / Fiber** – all REST + WebSocket API routes, JWT auth, multi-driver DB layer
- **GORM** – ORM with auto-migrate; both Postgres and SQLite drivers are wired
- **React + TypeScript** – full SPA with Zustand state management and React Router v6
- **Tailwind CSS + Framer Motion** – dark glass-morphism design system
- **Three.js + tsParticles** – interactive physics particle background
- **Recharts** – burndown charts, trend graphs, team performance analytics
- **WebSocket (Fiber + native)** – real-time notification push
- **`encoding/csv`** (stdlib) – CSV export (no extra dependency)
- **Docker Compose** – one-command local stack (Postgres + backend + frontend)

---

## 3. Implemented Features (as of this PR)

### Core Product
| Feature | Backend | Frontend |
|---|---|---|
| BYODB encrypted setup flow | ✅ AES-encrypted DB URL store | ✅ Setup wizard page |
| Auth (register / login / JWT) | ✅ | ✅ Login + Register pages |
| Projects CRUD + color/icon | ✅ | ✅ |
| Project members & roles (owner/admin/member) | ✅ | ✅ |
| Issues CRUD (story/task/bug/epic/subtask) | ✅ | ✅ |
| Kanban board + drag-and-drop | ✅ position sync | ✅ `@hello-pangea/dnd` |
| Backlog with per-sprint grouping | ✅ | ✅ |
| Sprints (planned → active → completed) | ✅ | ✅ |
| Comments on issues | ✅ | ✅ |
| File attachments (local disk) | ✅ | ✅ |
| Labels per project | ✅ | ✅ |
| Work logs / time tracking | ✅ | ✅ |
| Activity log (audit trail) | ✅ | ✅ |
| Notifications (in-app + WebSocket push) | ✅ | ✅ |
| Issue links (blocks / relates-to / duplicates) | ✅ | ✅ |
| Subtasks | ✅ | ✅ |
| Reports (burndown, trends, team stats) | ✅ | ✅ |
| Admin panel (user & project management) | ✅ | ✅ |
| Roadmap page | ✅ | ✅ |
| Dashboard (analytics + quickstart) | ✅ | ✅ |
| **Global search** *(added this PR)* | ✅ `GET /api/search` | ✅ Sidebar Cmd+K search |
| **CSV export** *(added this PR)* | ✅ `GET /api/export/issues` | ✅ Backlog "Export CSV" button |
| **User profile update** *(added this PR)* | ✅ `PUT /api/users/me` | ✅ Sidebar profile edit modal |
| i18n / locale switcher | — | ✅ |

---

## 4. Feature Gaps (Priority Order)

### P0 — Must-have before public launch

| Gap | Why it matters | Suggested approach |
|---|---|---|
| **Password change for own account** | Basic security expectation; admins can reset but users cannot change their own password | `PUT /api/users/me/password` – verify old password, bcrypt new |
| **Email invite flow** | Members can be added by admins but there's no self-service invite link | Add `invitations` table + SMTP / magic-link endpoint |
| **Watcher toggle on issues** | `Watchers` is in the model but no UI or endpoint to add/remove watchers | `POST/DELETE /api/issues/:id/watchers` |
| **SQLite migration parity** | Migrations folder covers Postgres syntax; `ILIKE` will fail on SQLite | Use `LIKE` with `lower()` for the search handler when `DBDriver=sqlite` |

### P1 — High value, ship in v1.1

| Gap | Why it matters | Suggested approach |
|---|---|---|
| **Import from CSV** | Mirrors the export story; "own your data" requires easy ingestion | `POST /api/import/issues` (multipart CSV) |
| **Backup / restore** | Core to BYODB promise | `GET /api/export/full` (JSON dump) + `POST /api/import/restore` |
| **Saved filters / views** | Power users need persistent board filters | `saved_views` table + UI filter builder |
| **Mention notifications** | `@username` in comments should trigger notification | Parse `@` in comment content at create time |
| **Custom issue statuses** | Hard-coded todo/in_progress/in_review/done limits flexibility | `project_statuses` table; migrate board columns dynamically |

### P2 — Growth features

| Gap | Why it matters |
|---|---|
| Real-time collaborative editing | Live cursor / live field updates via WebSocket |
| Offline mode + sync | Service Worker + IndexedDB queue |
| File attachment cloud storage | S3/R2 for teams that don't want local disk |
| GitHub / GitLab integration | Link commits and PRs to issues |
| Webhooks & API tokens | Let external tools push/pull data |
| SSO / SAML | Enterprise requirement |
| Time-zone aware due dates | Currently stores UTC without display conversion |

---

## 5. Technical Debt & Risk Areas

| Area | Risk | Fix |
|---|---|---|
| `jira-clone-frontend` package name | Confusing branding; still appears in `frontend/package.json` | Rename to `rex-frontend` |
| Hard-coded statuses in board | Breaks with custom status feature | Replace with project-level config |
| `encoding/csv` writes to response body writer directly | Correct but bypasses Fiber's response lifecycle; test with large exports | Consider streaming via `c.SendStream` |
| No rate limiting | Auth endpoints are unprotected from brute-force | Add Fiber `limiter` middleware on `/api/auth/*` |
| JWT secret default `"your-secret-key"` in config | Shipped insecure default | Fail-fast if `JWT_SECRET` is unset in non-dev env |
| Admin routes have no role guard at handler level | Any authenticated user who knows the URL could reach admin endpoints | Middleware: `if role != "admin" { return 403 }` |
| SQLite + `PrepareStmt: true` | `PrepareStmt` combined with SQLite can cause issues with concurrent writes | Disable `PrepareStmt` for SQLite driver |
| No request validation library | Input validation is manual per handler | Add `go-playground/validator` |

---

## 6. Prioritized Roadmap

### Sprint 1 (now → next 2 weeks) — Stability & Security
- [ ] Add rate limiting to auth endpoints
- [ ] Harden admin route middleware (role check)
- [ ] Fail-fast on default `JWT_SECRET` in production
- [ ] Fix SQLite `ILIKE` → `LIKE lower()` in search handler
- [ ] Rename `frontend/package.json` name to `rex-frontend`
- [ ] Add watcher toggle API + UI

### Sprint 2 — Data Ownership completeness
- [ ] `PUT /api/users/me/password` (change own password)
- [ ] CSV import (`POST /api/import/issues`)
- [ ] Full JSON backup/restore endpoints
- [ ] Email invite flow (token-based, SMTP configurable)

### Sprint 3 — UX & Power Features
- [ ] Saved filters / custom views
- [ ] Custom issue statuses per project
- [ ] Mention parsing in comments → notifications
- [ ] Mobile-responsive sidebar

### Sprint 4 — Integrations
- [ ] GitHub issue/PR linking
- [ ] Webhook outbound events
- [ ] API token management (personal access tokens)
- [ ] Slack notification integration

### Sprint 5 — Enterprise
- [ ] SSO / SAML 2.0
- [ ] Audit log export (CSV/JSON)
- [ ] SCIM user provisioning
- [ ] Multi-workspace tenant isolation

---

## 7. Implemented Changes in This PR

1. **`GET /api/search`** — Global search across projects and issues the user has access to.
   Accepts `?q=<term>&limit=<n>` (max 50). Results scoped to the caller's project membership.

2. **`GET /api/export/issues`** — Streams a CSV file of all issues in a project.
   Accepts `?projectId=<uuid>`. Headers include key, title, type, status, priority, assignee,
   sprint, story points, time estimates, labels, and timestamps.

3. **`PUT /api/users/me`** — Authenticated users can update their own `firstName`, `lastName`,
   and `avatar` without admin involvement.

4. **Frontend: Cmd+K global search** — Sidebar search bar with instant dropdown results,
   keyboard navigation, and debounced API calls. Links directly to issues and project boards.

5. **Frontend: Export CSV button** — "Export CSV" button in the Backlog header triggers a
   browser download of the CSV from the export endpoint.

6. **Frontend: Profile edit modal** — Clicking the user card in the sidebar opens a modal to
   update first name, last name, and avatar URL.

7. **Docker Compose + .env.example** — Renamed all `jira_clone*` container and database names
   to `rex_*` for consistent branding.
