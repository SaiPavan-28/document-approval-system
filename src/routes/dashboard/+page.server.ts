import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DocumentService } from '$lib/server/services/document.service';
import { AuditRepository } from '$lib/server/repositories/audit.repository';
import type { DocumentStatus } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const user = locals.user;

	// Fetch documents list for metrics
	const { items: docs } = await DocumentService.listDocuments(user, {
		page: 1,
		pageSize: 200,
		sortBy: 'updatedAt',
		sortOrder: 'desc'
	});

	// Compute metrics by status
	const byStatus: Record<DocumentStatus, number> = {
		draft: 0,
		submitted: 0,
		approved: 0,
		rejected: 0,
		published: 0,
		archived: 0
	};

	for (const doc of docs) {
		if (byStatus[doc.status] !== undefined) {
			byStatus[doc.status]++;
		}
	}

	// Fetch recent activity/notifications for the current user.
	// For authors: only events on THEIR documents (so they know status changes).
	// For reviewers/admins: all recent events across all documents.
	let notifications: any[] = [];
	try {
		if (user.role === 'author') {
			notifications = AuditRepository.findRecentSync({ authorId: user.id, limit: 15 });
		} else {
			notifications = AuditRepository.findRecentSync({ limit: 15 });
		}
	} catch {
		notifications = [];
	}

	return {
		user,
		metrics: {
			totalDocuments: docs.length,
			byStatus
		},
		recentDocuments: docs.slice(0, 5),
		notifications
	};
};
