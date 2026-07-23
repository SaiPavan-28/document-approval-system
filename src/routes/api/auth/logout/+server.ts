import { json, type RequestHandler } from '@sveltejs/kit';
import { AuthService } from '$lib/server/services/auth.service';

export const POST: RequestHandler = async ({ cookies }) => {
	const sessionId = cookies.get('session_id');
	if (sessionId) {
		await AuthService.logout(sessionId);
		cookies.delete('session_id', { path: '/' });
	}

	return json({ success: true, message: 'Logged out successfully' });
};
