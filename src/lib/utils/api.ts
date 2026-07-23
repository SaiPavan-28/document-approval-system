import type { ApiResponse, ApiError } from '$lib/types';

export class ApiFetchError extends Error {
	status: number;
	code: string;
	details?: Record<string, string[]>;
	isConflict: boolean;
	isUnauthorized: boolean;

	constructor(status: number, errorData: ApiError) {
		super(errorData.message || `HTTP Error ${status}`);
		this.name = 'ApiFetchError';
		this.status = status;
		this.code = errorData.code || 'UNKNOWN_ERROR';
		this.details = errorData.details;
		this.isConflict = status === 409;
		this.isUnauthorized = status === 401;
	}
}

async function handleResponse<T>(response: Response): Promise<T> {
	let json: ApiResponse<T> | null = null;
	try {
		json = await response.json();
	} catch {
		// Response body couldn't be parsed as JSON
	}

	if (!response.ok) {
		const errorData: ApiError = json?.error || {
			code: response.status === 409 ? 'CONCURRENCY_CONFLICT' : 'HTTP_ERROR',
			message: json?.error?.message || response.statusText || `Request failed with status ${response.status}`
		};
		throw new ApiFetchError(response.status, errorData);
	}

	if (json && json.success === false && json.error) {
		throw new ApiFetchError(response.status, json.error);
	}

	return (json?.data ?? json) as T;
}

export const api = {
	async get<T>(url: string, customFetch?: typeof fetch): Promise<T> {
		const f = customFetch || fetch;
		const res = await f(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		return handleResponse<T>(res);
	},

	async post<T>(url: string, body?: unknown, customFetch?: typeof fetch): Promise<T> {
		const f = customFetch || fetch;
		const res = await f(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
		return handleResponse<T>(res);
	},

	async put<T>(url: string, body?: unknown, customFetch?: typeof fetch): Promise<T> {
		const f = customFetch || fetch;
		const res = await f(url, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
		return handleResponse<T>(res);
	},

	async patch<T>(url: string, body?: unknown, customFetch?: typeof fetch): Promise<T> {
		const f = customFetch || fetch;
		const res = await f(url, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
		return handleResponse<T>(res);
	},

	async delete<T>(url: string, customFetch?: typeof fetch): Promise<T> {
		const f = customFetch || fetch;
		const res = await f(url, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		return handleResponse<T>(res);
	}
};
