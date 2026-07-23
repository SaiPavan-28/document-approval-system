// ──────────────────────────────────────────────
// Auth & RBAC Middleware Helpers
// ──────────────────────────────────────────────

import { UnauthorizedError, ForbiddenError } from '$lib/server/errors';
import type { User, UserRole } from '$lib/types';

/**
 * Ensures a request is authenticated.
 * Throws UnauthorizedError if no user is present in locals.
 */
export function requireAuth(locals: App.Locals): User {
	if (!locals.user) {
		throw new UnauthorizedError('Authentication required. Please log in.');
	}
	return locals.user;
}

/**
 * Ensures the authenticated user has one of the specified roles.
 * Throws ForbiddenError if the role requirement is not met.
 */
export function requireRole(locals: App.Locals, allowedRoles: readonly UserRole[]): User {
	const user = requireAuth(locals);

	if (!allowedRoles.includes(user.role)) {
		throw new ForbiddenError(
			`Forbidden: Your role (${user.role}) is not authorized to perform this action. Required: ${allowedRoles.join(', ')}.`
		);
	}

	return user;
}

/**
 * Ensures the authenticated user is either the resource owner or has one of the allowed roles.
 */
export function requireOwnerOrRole(
	locals: App.Locals,
	ownerId: string,
	allowedRoles: readonly UserRole[]
): User {
	const user = requireAuth(locals);

	if (user.id === ownerId || allowedRoles.includes(user.role)) {
		return user;
	}

	throw new ForbiddenError(
		'Forbidden: You must be the owner or have elevated permissions to perform this action.'
	);
}
