// ──────────────────────────────────────────────
// Audit Service
// ──────────────────────────────────────────────
import { AuditRepository, type CreateAuditLogData } from '$lib/server/repositories/audit.repository';
import { DocumentRepository } from '$lib/server/repositories/document.repository';
import { NotFoundError } from '$lib/server/errors';
import type { AuditLogWithActor, PaginatedResponse } from '$lib/types';
import type { TxOrDb } from '$lib/server/repositories/user.repository';

export class AuditService {
	/**
	 * Record an audit log event.
	 */
	static async recordLog(data: CreateAuditLogData, client?: TxOrDb) {
		return await AuditRepository.create(data, client);
	}

	/**
	 * Get the full audit log history for a specific document.
	 */
	static async getAuditHistory(
		documentId: string,
		page = 1,
		pageSize = 50
	): Promise<PaginatedResponse<AuditLogWithActor>> {
		// Ensure document exists
		const document = await DocumentRepository.findRawById(documentId);
		if (!document) {
			throw new NotFoundError(`Document with ID "${documentId}" was not found.`);
		}

		const { items, total } = await AuditRepository.findByDocumentId(documentId, {
			page,
			pageSize
		});

		return {
			items,
			total,
			page,
			pageSize
		};
	}
}
