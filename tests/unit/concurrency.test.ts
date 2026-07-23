import { describe, it, expect } from 'vitest';

interface DocumentRecord {
	id: string;
	title: string;
	content: string;
	version: number;
}

/**
 * In-memory simulator of PostgreSQL atomic update query logic:
 * UPDATE documents SET title = $1, content = $2, version = version + 1
 * WHERE id = $id AND version = $expectedVersion;
 */
function updateDocumentSimulated(
	dbState: Map<string, DocumentRecord>,
	docId: string,
	expectedVersion: number,
	newTitle: string,
	newContent: string
): { success: boolean; updatedDoc?: DocumentRecord; errorCode?: string } {
	const current = dbState.get(docId);
	if (!current) {
		return { success: false, errorCode: 'NOT_FOUND' };
	}

	// Atomic conditional check (WHERE version = $expectedVersion)
	if (current.version !== expectedVersion) {
		return { success: false, errorCode: 'CONFLICT' };
	}

	// Mutation & Version Increment
	const updated: DocumentRecord = {
		...current,
		title: newTitle,
		content: newContent,
		version: current.version + 1
	};

	dbState.set(docId, updated);
	return { success: true, updatedDoc: updated };
}

describe('Optimistic Concurrency Control (OCC) Unit Tests', () => {
	it('succeeds when client presents current document version', () => {
		const db = new Map<string, DocumentRecord>([
			['doc_1', { id: 'doc_1', title: 'Initial Title', content: 'Body', version: 1 }]
		]);

		const res = updateDocumentSimulated(db, 'doc_1', 1, 'Updated Title', 'New Body');
		expect(res.success).toBe(true);
		expect(res.updatedDoc?.version).toBe(2);
		expect(res.updatedDoc?.title).toBe('Updated Title');
	});

	it('rejects stale mutation when version has incremented (HTTP 409 Scenario)', () => {
		const db = new Map<string, DocumentRecord>([
			['doc_1', { id: 'doc_1', title: 'Initial Title', content: 'Body', version: 1 }]
		]);

		// Bob opens doc at version 1 and submits update -> version becomes 2
		const bobResult = updateDocumentSimulated(db, 'doc_1', 1, "Bob's Edit", 'Body');
		expect(bobResult.success).toBe(true);
		expect(db.get('doc_1')?.version).toBe(2);

		// Carol, holding stale version 1 from her page, attempts mutation
		const carolResult = updateDocumentSimulated(db, 'doc_1', 1, "Carol's Edit", 'Body');
		expect(carolResult.success).toBe(false);
		expect(carolResult.errorCode).toBe('CONFLICT');

		// State in DB remains Bob's edit and version 2 (data integrity preserved!)
		expect(db.get('doc_1')?.title).toBe("Bob's Edit");
		expect(db.get('doc_1')?.version).toBe(2);
	});
});
