// ──────────────────────────────────────────────
// Server Hooks — Authentication Middleware & Context Injection
// ──────────────────────────────────────────────

import type { Handle } from '@sveltejs/kit';
import { AuthService } from '$lib/server/services/auth.service';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session_id');

	if (sessionId) {
		const authData = await AuthService.getCurrentUser(sessionId);
		if (authData) {
			event.locals.user = authData.user;
			event.locals.session = authData.session;
		} else {
			event.locals.user = null;
			event.locals.session = null;
		}
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};
