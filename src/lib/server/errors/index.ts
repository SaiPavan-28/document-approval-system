// ──────────────────────────────────────────────
// Typed Application Error Classes
// ──────────────────────────────────────────────
// These provide consistent, typed error handling across the entire API layer.
// Each error maps to a specific HTTP status code and structured response.

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly code: string;
	public readonly details?: Record<string, string[]>;

	constructor(
		message: string,
		statusCode: number,
		code: string,
		details?: Record<string, string[]>
	) {
		super(message);
		this.name = 'AppError';
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;
	}

	toJSON() {
		return {
			success: false as const,
			error: {
				code: this.code,
				message: this.message,
				...(this.details ? { details: this.details } : {})
			}
		};
	}
}

/** 401 — User is not authenticated */
export class UnauthorizedError extends AppError {
	constructor(message = 'Authentication required. Please log in.') {
		super(message, 401, 'UNAUTHORIZED');
		this.name = 'UnauthorizedError';
	}
}

/** 403 — User lacks permission for this action */
export class ForbiddenError extends AppError {
	constructor(message = 'You do not have permission to perform this action.') {
		super(message, 403, 'FORBIDDEN');
		this.name = 'ForbiddenError';
	}
}

/** 404 — Resource not found */
export class NotFoundError extends AppError {
	constructor(message = 'The requested resource was not found.') {
		super(message, 404, 'NOT_FOUND');
		this.name = 'NotFoundError';
	}
}

/** 409 — Optimistic concurrency conflict (stale version) */
export class ConflictError extends AppError {
	public readonly currentVersion?: number;
	public readonly currentStatus?: string;

	constructor(
		message = 'This document has been modified by another user. Please reload and try again.',
		currentVersion?: number,
		currentStatus?: string
	) {
		super(message, 409, 'CONFLICT');
		this.name = 'ConflictError';
		this.currentVersion = currentVersion;
		this.currentStatus = currentStatus;
	}

	override toJSON() {
		return {
			...super.toJSON(),
			...(this.currentVersion !== undefined ? { currentVersion: this.currentVersion } : {}),
			...(this.currentStatus !== undefined ? { currentStatus: this.currentStatus } : {})
		};
	}
}

/** 422 — Validation error (Zod / business rule) */
export class ValidationError extends AppError {
	constructor(message: string, details?: Record<string, string[]>) {
		super(message, 422, 'VALIDATION_ERROR', details);
		this.name = 'ValidationError';
	}
}

/** 400 — Invalid state transition */
export class InvalidTransitionError extends AppError {
	constructor(message: string) {
		super(message, 400, 'INVALID_TRANSITION');
		this.name = 'InvalidTransitionError';
	}
}

/**
 * Convert an AppError (or unknown error) into a SvelteKit-compatible JSON Response.
 */
export function errorResponse(error: unknown): Response {
	if (error instanceof AppError) {
		return new Response(JSON.stringify(error.toJSON()), {
			status: error.statusCode,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	// Unknown / unexpected error — do not leak internal details
	console.error('Unexpected error:', error);
	return new Response(
		JSON.stringify({
			success: false,
			error: {
				code: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred. Please try again.'
			}
		}),
		{
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		}
	);
}
