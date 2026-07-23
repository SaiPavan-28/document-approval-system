import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	return {
		user: locals.user,
		session: locals.session,
		urlPath: url.pathname
	};
};
