# Controlled Document Approval System

A production-grade, full-stack document approval workflow built for the ElevateBox Engineering Challenge. Implements a strict state machine, server-enforced RBAC, atomic audit logging, and optimistic concurrency control.

---

## 🔴 Why Is It Not Working After Cloning? (READ THIS FIRST)

This is the **#1 reason** the app breaks for someone who just cloned it. There are **two root causes**:

### Cause 1: `better-sqlite3` Native Bindings
`better-sqlite3` is a **native C++ module**. When you run `npm install`, Node.js compiles it specifically for your operating system and CPU architecture. The compiled binary from your machine **cannot run on anyone else's machine**. Your friend needs to run `npm install` themselves to re-compile it for their system.

### Cause 2: The Database File Is Missing
The local `docapproval.db` database is **not committed to GitHub** (correctly excluded in `.gitignore`). Your friend's machine has no database, so the app crashes on startup and serves a broken, unstyled page. They must create it themselves using the seed script.

---

## 🚀 Complete Setup Guide (For Anyone Cloning This Project)

Follow every step in order. **Do not skip any step.**

### Step 1 — Prerequisites

Make sure the following are installed on your machine before proceeding:

| Tool | Required Version | Download |
|:---|:---|:---|
| **Node.js** | `v18.x` or higher (LTS) | https://nodejs.org |
| **npm** | Comes with Node.js | — |
| **Git** | Any recent version | https://git-scm.com |

Verify your installation by running:
```bash
node --version
# Expected: v18.x.x or higher

npm --version
# Expected: 8.x.x or higher
```

> ⚠️ If you are on Windows, it is highly recommended to also install the **Visual Studio C++ Build Tools** as `better-sqlite3` needs them to compile. Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

---

### Step 2 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/document-approval-system.git
cd document-approval-system
```

---

### Step 3 — Install Dependencies

This step downloads all packages **AND** compiles the native SQLite driver for your specific machine. This may take 1-2 minutes.

```bash
npm install
```

If this step fails with a build error on Windows, run this first:
```bash
npm install --global windows-build-tools
npm install
```

---

### Step 4 — Set Up the Database

The database file does not exist yet on your machine. Run this single command to **create the database and seed it with all required test users and sample data**:

```bash
npm run db:seed
```

You should see this output in your terminal:
```
🌱 Seeding database (SQLite)...
  ✓ Users seeded
  ✓ Documents seeded
  ✓ Audit logs seeded

✅ SQLite seed complete!
```

> ℹ️ You do **not** need to run `npm run db:push` separately. The seed script automatically creates all the tables if they don't already exist.

---

### Step 5 — Start the Development Server

```bash
npm run dev
```

You should see:
```
  VITE ready in ...ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 6 — Open in Browser

Navigate to: **http://localhost:5173**

You will be taken to the login page. No credentials are required — simply click on a user card to sign in.

---

## 👥 Test Accounts (No Password Required)

| Role | Name | Email | What They Can Do |
|:---|:---|:---|:---|
| **Author** | Alice Johnson | `alice@example.com` | Create drafts, edit own drafts, submit for review |
| **Reviewer** | Bob Smith | `bob@example.com` | Approve or reject submitted documents (must add a comment) |
| **Admin** | Admin User | `admin@example.com` | Archive documents, full visibility |
| **Viewer** | Viewer User | `viewer@example.com` | Read-only access to published documents only |

---

## 🛠 Tech Stack

| Layer | Technology |
|:---|:---|
| **Framework** | SvelteKit 2 + Svelte 5 |
| **Language** | TypeScript |
| **Database** | SQLite (via `better-sqlite3`) |
| **ORM** | Drizzle ORM |
| **Styling** | TailwindCSS v4 |
| **Icons** | Lucide-Svelte |
| **Validation** | Zod |
| **Build Tool** | Vite |

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/       # Shared UI components (Navbar, Sidebar, etc.)
│   ├── server/
│   │   ├── db/           # Database connection, schema, seed script
│   │   ├── services/     # Business logic (DocumentService)
│   │   └── middleware/   # Auth helpers
│   ├── state-machine/    # Document transition rules
│   └── stores/           # Svelte state stores
└── routes/
    ├── dashboard/        # Home screen (notifications, stats)
    ├── documents/        # Document CRUD + detail pages
    ├── login/            # Passwordless login page
    └── api/              # All REST API endpoints
```

---

## 🔧 All Available Commands

| Command | Description |
|:---|:---|
| `npm run dev` | Start development server at http://localhost:5173 |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run db:seed` | Create the database tables and insert all seed data |
| `npm run check` | Run TypeScript and Svelte type checks |

---

## ❓ Troubleshooting

### "Page loads with no styles / looks like plain HTML"
The CSS did not load because **the server crashed on startup** due to a missing database. Fix it:
1. Delete any existing `docapproval.db` file in the root directory.
2. Run `npm run db:seed` to recreate it.
3. Run `npm run dev` again.

### "Cannot find module 'better-sqlite3'"
The native binary was not compiled for your machine.
1. Delete the `node_modules` folder entirely.
2. Run `npm install` again.

### "Error: ENOENT: no such file or directory, open 'docapproval.db'"
The database file is missing. Run `npm run db:seed`.

### "npm install fails with build errors on Windows"
You are missing the C++ build tools. Run:
```bash
npm install --global windows-build-tools
```
Then retry `npm install`.

---

## 📝 Design Note

### Key Invariants
- A document **cannot skip states** (e.g., `draft → published` is forbidden — must go through `submitted → approved → published`).
- An author **cannot approve their own document**.
- Every state change and the audit log entry for it are written in a **single atomic SQLite transaction** — they either both succeed or both fail.
- **Optimistic Concurrency Control (OCC)**: Each document has a `version` number. A mutation is only accepted if the client sends the correct current version, preventing stale overwrites from concurrent users.

### Architecture Decisions
- Raw synchronous `better-sqlite3` transactions are used for all mutations (instead of Drizzle's async transaction API) to guarantee true atomicity without async/promise pitfalls.
- All authorization is enforced **server-side only** — the frontend state is never trusted for permission decisions.
