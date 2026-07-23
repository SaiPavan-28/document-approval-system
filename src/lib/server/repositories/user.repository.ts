// ──────────────────────────────────────────────
// User & Session Repository
// ──────────────────────────────────────────────
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { User, Session } from '$lib/types';

export type TxOrDb = typeof db | Parameters<Parameters<typeof db['transaction']>[0]>[0];

export class UserRepository {
	/**
	 * Find a user by primary key ID.
	 */
	static async findById(id: string, client: TxOrDb = db): Promise<User | null> {
		const [user] = await client
			.select()
			.from(users)
			.where(eq(users.id, id))
			.limit(1);

		return user ?? null;
	}

	/**
	 * Find a user by email address.
	 */
	static async findByEmail(email: string, client: TxOrDb = db): Promise<User | null> {
		const [user] = await client
			.select()
			.from(users)
			.where(eq(users.email, email.toLowerCase().trim()))
			.limit(1);

		return user ?? null;
	}

	/**
	 * Create a new user session.
	 */
	static async createSession(
		sessionId: string,
		userId: string,
		expiresAt: Date,
		client: TxOrDb = db
	): Promise<Session> {
		const [session] = await client
			.insert(sessions)
			.values({
				id: sessionId,
				userId,
				expiresAt
			})
			.returning();

		return session;
	}

	/**
	 * Find an active (non-expired) session by session ID.
	 */
	static async findSessionById(sessionId: string, client: TxOrDb = db): Promise<Session | null> {
		const [session] = await client
			.select()
			.from(sessions)
			.where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
			.limit(1);

		return session ?? null;
	}

	/**
	 * Delete a session by ID (logout).
	 */
	static async deleteSession(sessionId: string, client: TxOrDb = db): Promise<void> {
		await client.delete(sessions).where(eq(sessions.id, sessionId));
	}

	/**
	 * Delete all sessions for a specific user.
	 */
	static async deleteUserSessions(userId: string, client: TxOrDb = db): Promise<void> {
		await client.delete(sessions).where(eq(sessions.userId, userId));
	}
}
