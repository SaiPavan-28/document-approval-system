# System Architecture & Design Documentation (DESIGN.md)

> Submitted for the **ElevateBox Engineering Challenge — Controlled Document Approval System**

---

## 1. What are the most important invariants in your system?

1. **State Machine Invariant**: A document can only transition along defined directed edges (`draft` → `submitted` → `approved`/`rejected` → `published`, `rejected` → `draft`, and any state → `archived`). No invalid transition can ever succeed under any circumstances.
2. **Audit Synchronization Invariant**: Every document state change or content update MUST be accompanied by an append-only audit event. No document state may ever mutate without a matching audit record.
3. **Ownership-Aware Review Invariant**: A reviewer or admin cannot approve or reject a document they authored (`authorId !== actorId`).
4. **Read Isolation Invariant**: Unauthenticated users can access zero documents. Users with `viewer` role can access ONLY documents where `status = 'published'` and `deleted_at IS NULL`.
5. **Mandatory Rejection Reason**: Rejection (`submitted` → `rejected`) MUST include a non-empty comment explaining the rejection rationale.
6. **Optimistic Concurrency Invariant**: A mutation must specify the exact `version` integer read by the client. Stale writes must be rejected with HTTP 409 Conflict.
7. **Immutability of Audit Logs**: Audit logs are append-only. No application operation provides UPDATE or DELETE endpoints for audit events.

---

## 2. Which invariants are enforced by the database, and which by application code?

| Invariant | Database Layer (PostgreSQL) | Application Layer (TypeScript / Drizzle / Zod) |
| :--- | :--- | :--- |
| **Enum Constraints** | `pgEnum('document_status', [...])` prevents arbitrary string values in DB columns. | Zod schema checks enum types at API boundaries. |
| **Foreign Key Integrity** | `author_id FK → users.id`, `document_id FK → documents.id`. Cascade/Restrict constraints. | Application validates entity existence before referencing. |
| **Non-Empty Constraints** | `CHECK (length(trim(title)) > 0)` and `CHECK (length(trim(content)) > 0)`. | Zod `.min(1)` validation before query execution. |
| **Version Monotonicity** | `CHECK (version > 0)` constraint on `version` column. | Atomic `SET version = version + 1` in SQL UPDATE statement. |
| **Atomic State + Audit** | PostgreSQL `BEGIN ... COMMIT` transactions (`db.transaction(...)`). | Orchestration logic executing document UPDATE and audit INSERT inside single transaction callback. |
| **Optimistic Concurrency** | Conditional update matching `WHERE id = $id AND version = $expectedVersion`. | Row count check (`rowsAffected === 0` → throw `ConflictError`). |
| **Role & Ownership Enforcement** | N/A | Server-side RBAC middleware and `validateTransition` pure function. |
| **Self-Approval Block** | N/A | Server assertion: `requiresNotOwner && actorId === documentAuthorId`. |
| **Rejection Comment Guard** | N/A | Zod schema `rejectSchema` requiring non-empty string. |

---

## 3. How do permissions work?

Permissions follow a strict **Layered Server-Side Guard** model. Frontend button visibility is purely cosmetic; every API route enforces authorization independently.

```
Request → Authentication Middleware (Session lookup)
        → Role Authorization Guard (Viewer/Author/Reviewer/Admin check)
        → Entity Ownership & State Guard (Author == Owner? State valid?)
        → Version OCC Guard (Version matches expected?)
        → Transaction Execution
```

- **Role Definitions**:
  - `viewer`: Read access restricted strictly to `published` documents.
  - `author`: Read access to owned documents and public documents. Write access to create drafts, edit owned `draft`/`rejected` documents, submit owned drafts, and reopen owned rejected docs.
  - `reviewer`: Read access to all documents. Write access to approve or reject `submitted` docs (excluding own docs) and publish `approved` docs.
  - `admin`: Full administrative access. Superuser role capable of archiving documents in any state and overriding standard workflow rules while still preserving audit integrity and self-approval restrictions.

---

## 4. How do you prevent stale or conflicting updates?

Stale updates are prevented using **Optimistic Concurrency Control (OCC)**:

1. **Version Counter**: Every `documents` row carries an integer `version` field starting at `1`.
2. **Client Expectation**: When a client fetches a document, the response includes `{ id, title, content, status, version }`.
3. **Atomic Conditional Mutation**: All mutations (updates or state transitions) require an `expectedVersion` payload parameter. The server executes:
   ```sql
   UPDATE documents
   SET title = $1, content = $2, version = version + 1, updated_at = NOW()
   WHERE id = $id AND version = $expectedVersion AND deleted_at IS NULL
   RETURNING *;
   ```
4. **Conflict Handling**: If another user mutated the document in the interim, `version` in PostgreSQL will have incremented (e.g. to `2`). The conditional query updates `0` rows.
5. **Conflict Response**: The server rolls back the transaction, catches the `0` row result, and throws a `ConflictError` (HTTP 409). The API returns the current server document state so the UI can display a resolution dialog ("Document changed by Bob 2 minutes ago").

---

## 5. How do you keep audit events consistent with document state changes?

Consistency is guaranteed via **Single Database Transactions (`db.transaction`)**:

```typescript
await db.transaction(async (tx) => {
  // 1. Mutate document state with OCC check
  const [updatedDoc] = await tx.update(documents)
    .set({ status: newStatus, version: sql`version + 1`, updatedAt: new Date() })
    .where(and(eq(documents.id, id), eq(documents.version, expectedVersion)))
    .returning();

  if (!updatedDoc) {
    throw new ConflictError('Document state modified concurrently.');
  }

  // 2. Insert audit log entry within the SAME transaction
  await tx.insert(auditLogs).values({
    id: nanoid(),
    documentId: id,
    actorId: actor.id,
    action: transitionRule.auditAction,
    fromStatus: currentStatus,
    toStatus: newStatus,
    comment: comment ?? null,
    ipAddress,
    userAgent
  });
});
```

Because both operations reside inside a single PostgreSQL transaction:
- If the database crashes or connection fails after document update but before audit insert, PostgreSQL automatically rolls back the document update.
- An audit log entry CANNOT exist without its corresponding document state change, and vice versa.

---

## 6. What failure cases did you consider?

1. **Race Condition / Double Approval**: Two reviewers click "Approve" simultaneously. First request succeeds (version 2 → 3); second request fails version match (expected 2, found 3) → HTTP 409 Conflict.
2. **Author Self-Approval**: A user with dual Author/Reviewer role attempts to submit and approve their own document. Blocked by `requiresNotOwner` server rule → HTTP 403 Forbidden.
3. **Draft Mutation on Published Content**: Malicious user sends a `PATCH /api/documents/:id` to modify a published document. Blocked by `isEditableStatus()` check → HTTP 400 Bad Request.
4. **Bypassing UI to Access Unpublished Docs**: `viewer` role guesses the UUID of a draft document. Server query appends `WHERE status = 'published'` for viewer role → HTTP 404 Not Found (zero information leakage).
5. **Rejection Without Comment**: Client strips comment payload on rejection. Zod validation rejects request at edge → HTTP 422 Unprocessable Entity.
6. **Partial Transaction Failure**: Database disconnects mid-operation. Atomic `db.transaction()` ensures zero partial writes.

---

## 7. What would you improve with more time?

1. **Visual Side-by-Side Diff Viewer**: Enhanced UI to highlight text additions and deletions between versions in the audit timeline.
2. **WebSocket / Server-Sent Events (SSE)**: Real-time update notifications notifying active readers when a document status changes without requiring page refresh.
3. **Database Migration Pipeline**: Automated CI/CD integration running `drizzle-kit migrate` in pre-deploy hooks.
4. **Redis Read Caching**: Cache published document reads with automated cache invalidation on publication/archival.

---

## 8. What would need to change for a real production system?

1. **Authentication Provider**: Replace seeded session cookie with OAuth 2.0 / OIDC (e.g. Auth0, Clerk, or enterprise SAML SSO).
2. **Rate Limiting Middleware**: Implement sliding-window rate limiting (using Redis) on API routes to prevent denial of service.
3. **Structured Audit Retention Policies**: Archive audit logs older than 7 years to cold storage (e.g. AWS S3 Glacier) with cryptographic signatures for compliance.
4. **Row-Level Security (RLS)**: Enforce tenant multi-tenancy and role visibility directly inside PostgreSQL using Postgres RLS policies.

---

## Optional: Technical Insight Learned Outside Web Stack

> **Learning from Database Internals (PostgreSQL WAL & MVCC)**: Studying Write-Ahead Logging (WAL) and Multi-Version Concurrency Control (MVCC) in PostgreSQL fundamentally changed how I view web application state. Understanding that relational databases achieve isolation by keeping row versions and appending transitions sequentially to an immutable log inspired the design of this document approval system — treating audit logs not as a secondary logging feature, but as an append-only event ledger mirroring database WAL semantics.
