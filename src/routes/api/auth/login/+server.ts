import { json, type RequestHandler } from '@sveltejs/kit';
import { AuthService } from '$lib/server/services/auth.service';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { email } = await request.json();
		if (!email) {
			return json({ success: false, error: { code: 'INVALID_INPUT', message: 'Email address is required' } }, { status: 400 });
		}

		const { user, session } = await AuthService.login(email);

		// Set cookie
		cookies.set('session_id', session.id, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		return json({
			success: true,
			data: { user, session }
		});
	} catch (err: any) {
		return json(
			{
				success: false,
				error: {
					code: err.code || 'LOGIN_FAILED',
					message: err.message || 'Failed to authenticate user'
				}
			},
			{ status: err.statusCode || 400 }
		);
	}
};
