// ──────────────────────────────────────────────
// Request Validation Middleware Helpers
// ──────────────────────────────────────────────

import { z } from 'zod';
import { ValidationError } from '$lib/server/errors';

/**
 * Parses and validates JSON body against a Zod schema.
 * Throws a formatted ValidationError on failure.
 */
export async function validateBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		throw new ValidationError('Invalid request body. Expected valid JSON.');
	}

	const result = schema.safeParse(body);

	if (!result.success) {
		const details: Record<string, string[]> = {};

		for (const issue of result.error.issues) {
			const path = issue.path.join('.') || '_root';
			if (!details[path]) {
				details[path] = [];
			}
			details[path].push(issue.message);
		}

		throw new ValidationError('Validation failed for input data.', details);
	}

	return result.data;
}

/**
 * Parses and validates URL query parameters against a Zod schema.
 * Throws a formatted ValidationError on failure.
 */
export function validateQuery<T>(url: URL, schema: z.ZodType<T>): T {
	const params: Record<string, string> = {};

	url.searchParams.forEach((value, key) => {
		params[key] = value;
	});

	const result = schema.safeParse(params);

	if (!result.success) {
		const details: Record<string, string[]> = {};

		for (const issue of result.error.issues) {
			const path = issue.path.join('.') || '_root';
			if (!details[path]) {
				details[path] = [];
			}
			details[path].push(issue.message);
		}

		throw new ValidationError('Validation failed for query parameters.', details);
	}

	return result.data;
}
