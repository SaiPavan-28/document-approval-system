# 📄 ElevateBox — Controlled Document Approval System

> A production-grade, full-stack document approval workflow built for the **ElevateBox Engineering Challenge**.

[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-FF3E00?style=flat-square&logo=svelte)](https://kit.svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite)](https://github.com/WiseLibs/better-sqlite3)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🌟 Why This Project Matters

In most organizations, documents — policies, proposals, technical specs — go through a human approval chain before they can be published. Without proper controls, **anyone can publish anything**, approvals can be bypassed, and there is no record of who did what and when.

This system solves that problem by enforcing a **strict, server-side state machine** that guarantees:

- 📋 A document **cannot skip states** — it must travel `Draft → Submitted → Approved → Published` in order.
- 🔒 **Role-based permissions** are enforced entirely on the server — the UI cannot lie to bypass them.
- 🧾 **Every action is permanently recorded** in an immutable audit log that is written in the same database transaction as the state change — it is physically impossible for a state change to exist without a corresponding audit entry.
- ⚡ **Race conditions are prevented** using Optimistic Concurrency Control — two reviewers cannot simultaneously approve and reject the same document without one of them being told the document was already acted on.

This is not a proof-of-concept — it is a demonstration of the exact patterns used in production document management systems, compliance tools, and regulated-industry software.

---

## ✨ Key Features

| Feature | Description |
|:---|:---|
| 🔐 **Server-enforced RBAC** | All permissions validated on the server. The client is never trusted. |
| 🔄 **State Machine** | Documents follow a strict `draft → submitted → approved → published` pipeline. |
| 🧾 **Atomic Audit Logging** | State change + audit entry written in a single SQLite transaction. Can never be out of sync. |
| ⚡ **Optimistic Concurrency Control** | Version numbers prevent stale client overwrites and race conditions. |
| 🌗 **Light & Dark Mode** | Full theme switcher with preference saved to localStorage. |
| 📬 **Rejection Notifications** | Authors receive clear, actionable feedback on the dashboard when their document is rejected. |
| 📥 **PDF Download** | Published documents can be downloaded as PDFs with author and approver details. |
| 📜 **Visual Audit Timeline** | Every action is displayed in a clear, human-readable timeline with sentence-level descriptions. |

---

## 🚀 Step-by-Step Setup Guide

Follow every step in order. **Do not skip any step.**

### Step 1 — Prerequisites

Ensure the following are installed on your machine:

| Tool | Required Version | Download |
|:---|:---|:---|
| **Node.js** | `v18.x` or higher (LTS) | https://nodejs.org |
| **npm** | Comes with Node.js | — |
| **Git** | Any recent version | https://git-scm.com |

Verify your installation:
```bash
node --version    # Expected: v18.x.x or higher
npm --version     # Expected: 8.x.x or higher
```

> ⚠️ **Windows Users:** `better-sqlite3` requires C++ build tools to compile. If `npm install` fails, first run:
> ```bash
> npm install --global windows-build-tools
> ```
> Then retry `npm install`.

---

### Step 2 — Clone the Repository

```bash
git clone https://github.com/SaiPavan-28/ElevateBox_Challenge.git
cd ElevateBox_Challenge
```

---

### Step 3 — Install Dependencies

This downloads all packages and compiles the native SQLite driver for your machine. This may take 1–2 minutes.

```bash
npm install
```

---

### Step 4 — Set Up the Database

Run the seed script to automatically **create all database tables** and **insert all required test users and sample documents**:

```bash
npm run db:seed
```

Expected output:
```
🌱 Seeding database (SQLite)...
  ✓ Users seeded
  ✓ Documents seeded
  ✓ Audit logs seeded

✅ SQLite seed complete!
```

---

### Step 5 — Start the Development Server

```bash
npm run dev
```

Expected output:
```
  VITE ready in ...ms

  ➜  Local:   http://localhost:5173/
```

---

### Step 6 — Open in Browser

Navigate to: **[http://localhost:5173](http://localhost:5173)**

You will land on the login page. **No password is required** — simply click any user card to sign in as that role.

---

## 👥 Test Accounts

| Role | Name | Email | Permissions |
|:---|:---|:---|:---|
| ✍️ **Author** | Alice Johnson | `alice@example.com` | Create drafts, edit own docs, submit for review |
| ✅ **Reviewer** | Bob Smith | `bob@example.com` | Approve or reject submitted documents (must add a comment to reject) |
| 🛡️ **Admin** | Admin User | `admin@example.com` | Archive documents, full system visibility |
| 👁️ **Viewer** | Viewer User | `viewer@example.com` | Read-only access to published documents only |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Framework** | SvelteKit 2 + Svelte 5 | Full-stack web framework with SSR |
| **Language** | TypeScript | End-to-end type safety |
| **Database** | SQLite via `better-sqlite3` | Embedded, zero-config local database |
| **ORM** | Drizzle ORM | Schema definition and type-safe queries |
| **Styling** | TailwindCSS v4 | Utility-first CSS with custom design system |
| **Icons** | Lucide-Svelte | Consistent, clean icon set |
| **Validation** | Zod | Runtime schema validation on API inputs |
| **Build Tool** | Vite | Lightning-fast HMR dev server |

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/          # Shared UI components (Navbar, Sidebar, AuditTimeline, etc.)
│   ├── server/
│   │   ├── db/              # Database connection, schema, and seed script
│   │   ├── services/        # Business logic (DocumentService, AuthService)
│   │   ├── repositories/    # Data access layer
│   │   └── middleware/      # Auth guards and request validation
│   ├── state-machine/       # Document state transition rules and validation
│   ├── stores/              # Svelte state stores (auth, toast)
│   └── types/               # Shared TypeScript type definitions
└── routes/
    ├── dashboard/            # Home screen with notifications and stats
    ├── documents/            # Document list, detail, edit, and new pages
    ├── login/                # Passwordless role-based login page
    └── api/                  # REST API endpoints for all document actions
```

---

## 🔧 Available Commands

| Command | Description |
|:---|:---|
| `npm run dev` | Start the development server at http://localhost:5173 |
| `npm run build` | Build the app for production |
| `npm run preview` | Preview the production build locally |
| `npm run db:seed` | Create all database tables and insert seed data |
| `npm run db:push` | Push Drizzle schema migrations to the database |
| `npm run check` | Run TypeScript and Svelte type checks |

---

## 📝 Design Notes

### System Invariants
- A document **cannot bypass** the state machine (e.g., `draft → published` is strictly forbidden).
- Only the **owner/author** can edit a document, and only when it is in `draft` or `rejected` state.
- An author **cannot approve or reject their own document**.
- A document **cannot be rejected without a mandatory comment**.
- **Viewers** have zero access to any document that isn't `published`.

### How Audit Consistency Is Guaranteed
The document state update and its audit log entry are written inside a **single raw `better-sqlite3` synchronous transaction**. If either operation fails, the entire transaction is rolled back. A state change simply **cannot exist without a corresponding audit entry**.

### How Concurrency Is Handled
Every document has a `version` integer column. When a client submits a mutation, it must include the `expectedVersion` it last saw. The server checks `current_db_version === expectedVersion`. If they don't match (someone else acted first), the server rejects the request with `409 Conflict` and the UI shows a conflict dialog — **preventing silent data loss**.

---

## 🧩 Document Workflow

```
                  ┌─────────┐
                  │  DRAFT  │◄──────────────────┐
                  └────┬────┘                   │
                       │ Submit (Author)         │ Reopen (Admin)
                       ▼                         │
                 ┌───────────┐                   │
                 │ SUBMITTED │                   │
                 └─────┬─────┘                   │
          ┌────────────┼────────────┐            │
  Approve │            │            │ Reject      │
(Reviewer)│            │            │(Reviewer)   │
          ▼            │            ▼             │
     ┌──────────┐      │      ┌──────────┐       │
     │ APPROVED │      │      │ REJECTED │───────┘
     └────┬─────┘      │      └──────────┘
          │ Publish     │
          │ (Admin)     │
          ▼             │
     ┌──────────┐       │
     │ PUBLISHED│       │
     └────┬─────┘       │
          │ Archive     │
          │ (Admin)     │
          ▼
     ┌──────────┐
     │ ARCHIVED │
     └──────────┘
```

---

<div align="center">
  <sub>Built with ❤️ for the ElevateBox Engineering Challenge</sub>
</div>
