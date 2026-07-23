import { writable } from 'svelte/store';
import type { User } from '$lib/types';

function createAuthStore() {
	const { subscribe, set, update } = writable<User | null>(null);

	return {
		subscribe,
		setUser: (user: User | null) => set(user),
		clearUser: () => set(null)
	};
}

export const authStore = createAuthStore();

// Seeded users list for convenient display & testing
export const SEEDED_USERS = [
	{
		name: 'Alice Johnson',
		email: 'alice@example.com',
		role: 'author' as const,
		avatar: 'AJ',
		description: 'Can create drafts, edit drafts/rejected docs, and submit documents.'
	},
	{
		name: 'Bob Smith',
		email: 'bob@example.com',
		role: 'reviewer' as const,
		avatar: 'BS',
		description: 'Can review submitted docs (approve or reject with comment) and publish approved docs.'
	},
	{
		name: 'Admin User',
		email: 'admin@example.com',
		role: 'admin' as const,
		avatar: 'AU',
		description: 'Full administrative access. Can perform all actions and archive documents from any state.'
	},
	{
		name: 'Viewer User',
		email: 'viewer@example.com',
		role: 'viewer' as const,
		avatar: 'VU',
		description: 'Read-only access to documents and audit history logs.'
	}
];
