// ──────────────────────────────────────────────
// Auth Service
// ──────────────────────────────────────────────
import { nanoid } from 'nanoid';
import { UserRepository } from '$lib/server/repositories/user.repository';
import { NotFoundError, UnauthorizedError } from '$lib/server/errors';
import type { User, Session } from '$lib/types';

export class AuthService {
	/**
	 * Log in a user by email address and create a new session.
	 */
	static async login(email: string): Promise<{ user: User; session: Session }> {
		const user = await UserRepository.findByEmail(email);

		if (!user) {
			throw new NotFoundError(`No account found with email address: ${email}`);
		}

		// Session valid for 7 days
		const sessionId = nanoid();
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		// Clean up existing sessions for this user before creating a new one
		await UserRepository.deleteUserSessions(user.id);

		const session = await UserRepository.createSession(sessionId, user.id, expiresAt);

		return { user, session };
	}

	/**
	 * Log out a user by invalidating their session.
	 */
	static async logout(sessionId: string): Promise<void> {
		if (sessionId) {
			await UserRepository.deleteSession(sessionId);
		}
	}

	/**
	 * Retrieve current user and session given a session ID.
	 */
	static async getCurrentUser(
		sessionId: string | null | undefined
	): Promise<{ user: User; session: Session } | null> {
		if (!sessionId) {
			return null;
		}

		const session = await UserRepository.findSessionById(sessionId);
		if (!session) {
			return null;
		}

		const user = await UserRepository.findById(session.userId);
		if (!user) {
			return null;
		}

		return { user, session };
	}
}
