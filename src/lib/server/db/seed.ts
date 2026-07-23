// ──────────────────────────────────────────────
// Database Seed Script (SQLite Local Engine)
// ──────────────────────────────────────────────

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { nanoid } from 'nanoid';
import path from 'path';
import * as schema from './schema';

const dbPath = path.resolve(process.cwd(), 'docapproval.db');

async function seed() {
	const sqlite = new Database(dbPath);
	
	// Create tables if not existing
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			role TEXT NOT NULL DEFAULT 'author',
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			expires_at INTEGER NOT NULL,
			created_at INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS documents (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'draft',
			version INTEGER NOT NULL DEFAULT 1,
			author_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			deleted_at INTEGER
		);

		CREATE TABLE IF NOT EXISTS audit_logs (
			id TEXT PRIMARY KEY,
			document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
			actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
			action TEXT NOT NULL,
			from_status TEXT,
			to_status TEXT NOT NULL,
			comment TEXT,
			changes TEXT,
			ip_address TEXT,
			user_agent TEXT,
			created_at INTEGER NOT NULL
		);
	`);

	const db = drizzle(sqlite, { schema });

	console.log('🌱 Seeding database (SQLite)...');

	// ── Seed Users (PDF Page 4) ──
	const userIds = {
		alice: 'user_alice_123',
		bob: 'user_bob_456',
		admin: 'user_admin_789',
		viewer: 'user_viewer_000'
	};

	await db
		.insert(schema.users)
		.values([
			{
				id: userIds.alice,
				name: 'Alice Johnson',
				email: 'alice@example.com',
				role: 'author'
			},
			{
				id: userIds.bob,
				name: 'Bob Smith',
				email: 'bob@example.com',
				role: 'reviewer'
			},
			{
				id: userIds.admin,
				name: 'Admin User',
				email: 'admin@example.com',
				role: 'admin'
			},
			{
				id: userIds.viewer,
				name: 'Viewer User',
				email: 'viewer@example.com',
				role: 'viewer'
			}
		])
		.onConflictDoNothing();

	console.log('  ✓ Users seeded');

	// ── Seed Sample Documents ──
	const now = new Date();
	const docIds = {
		draft: 'doc_draft_001',
		submitted: 'doc_submitted_002',
		approved: 'doc_approved_003',
		rejected: 'doc_rejected_004',
		published: 'doc_published_005',
		archived: 'doc_archived_006'
	};

	await db
		.insert(schema.documents)
		.values([
			{
				id: docIds.draft,
				title: 'Q3 Engineering Roadmap',
				content:
					'This document outlines the engineering priorities for Q3, including infrastructure upgrades, API improvements, and developer experience enhancements.',
				status: 'draft',
				version: 1,
				authorId: userIds.alice,
				createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
				updatedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
			},
			{
				id: docIds.submitted,
				title: 'Data Privacy Policy v2.0',
				content:
					'Updated privacy policy incorporating GDPR requirements, data retention changes, and consent management processes. This revision addresses feedback from legal review and compliance audit findings.',
				status: 'submitted',
				version: 3,
				authorId: userIds.alice,
				createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
				updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
			},
			{
				id: docIds.approved,
				title: 'API Rate Limiting Strategy',
				content:
					'Proposal for implementing tiered rate limiting across all public API endpoints. Includes token bucket algorithm details, per-tier quotas, and graceful degradation plan.',
				status: 'approved',
				version: 4,
				authorId: userIds.alice,
				createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
				updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
			},
			{
				id: docIds.rejected,
				title: 'Microservices Migration Plan',
				content:
					'Initial proposal for migrating the monolith to microservices. Needs revision based on reviewer feedback regarding service boundaries and data ownership.',
				status: 'rejected',
				version: 2,
				authorId: userIds.alice,
				createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
				updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
			},
			{
				id: docIds.published,
				title: 'Incident Response Runbook',
				content:
					'Step-by-step guide for handling production incidents including severity classification, escalation procedures, communication templates, and post-mortem process. This document has been reviewed and approved for organization-wide use.',
				status: 'published',
				version: 5,
				authorId: userIds.alice,
				createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
				updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
			},
			{
				id: docIds.archived,
				title: 'Legacy System Decommission Plan',
				content:
					'Plan for decommissioning the legacy billing system. Archived after the migration was completed successfully.',
				status: 'archived',
				version: 3,
				authorId: userIds.alice,
				createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
				updatedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
				deletedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)
			}
		])
		.onConflictDoNothing();

	console.log('  ✓ Documents seeded');

	// ── Seed Audit Logs ──
	await db
		.insert(schema.auditLogs)
		.values([
			{
				id: nanoid(),
				documentId: docIds.draft,
				actorId: userIds.alice,
				action: 'DOCUMENT_CREATED',
				fromStatus: null,
				toStatus: 'draft',
				createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
			},
			{
				id: nanoid(),
				documentId: docIds.submitted,
				actorId: userIds.alice,
				action: 'DOCUMENT_CREATED',
				fromStatus: null,
				toStatus: 'draft',
				createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
			},
			{
				id: nanoid(),
				documentId: docIds.submitted,
				actorId: userIds.alice,
				action: 'DOCUMENT_SUBMITTED',
				fromStatus: 'draft',
				toStatus: 'submitted',
				createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
			},
			{
				id: nanoid(),
				documentId: docIds.approved,
				actorId: userIds.bob,
				action: 'DOCUMENT_APPROVED',
				fromStatus: 'submitted',
				toStatus: 'approved',
				comment: 'Looks good. Well-structured proposal.',
				createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
			},
			{
				id: nanoid(),
				documentId: docIds.rejected,
				actorId: userIds.bob,
				action: 'DOCUMENT_REJECTED',
				fromStatus: 'submitted',
				toStatus: 'rejected',
				comment: 'Service boundaries need clearer definition. Please revise the data ownership section.',
				createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
			},
			{
				id: nanoid(),
				documentId: docIds.published,
				actorId: userIds.admin,
				action: 'DOCUMENT_PUBLISHED',
				fromStatus: 'approved',
				toStatus: 'published',
				createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
			}
		])
		.onConflictDoNothing();

	console.log('  ✓ Audit logs seeded');
	console.log('');
	console.log('✅ SQLite seed complete!');
}

seed().catch((err) => {
	console.error('❌ Seed failed:', err);
	process.exit(1);
});
