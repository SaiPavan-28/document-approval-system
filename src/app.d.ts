import type { User, Session } from '$lib/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
		}
		interface PageData {
			user: User | null;
			session: Session | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
