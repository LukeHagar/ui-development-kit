import {
	checkToken,
	getSession,
	getToken,
	getTokenDetails,
	lastCheckedToken,
	setTokenDetails
} from '$lib/utils/oauth';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = getSession(event.cookies);
	event.locals.idnSession = await getToken(event.cookies);

	console.log('Handle Session:', event.locals.session);

	if (event.locals.idnSession) {
		const lastToken = lastCheckedToken(event.cookies);
		const tokenDetails = getTokenDetails(event.cookies);
		if (tokenDetails && lastToken && lastToken === event.locals.idnSession.access_token) {
			event.locals.tokenDetails = tokenDetails;
		} else {
			const tempTokenDetails = await checkToken(
				event.locals.session.baseUrl,
				event.locals.idnSession.access_token
			);
			if (tempTokenDetails) {
				event.locals.tokenDetails = tempTokenDetails;
				setTokenDetails(event.cookies, tempTokenDetails);
			}
		}
	}

	if (event.url.pathname.startsWith('/home') || event.url.pathname.startsWith('/api')) {
		if (!event.locals.session || !event.locals.idnSession) {
			console.log('No session or idnSession found, redirecting to /');
			redirect(401, '/');
		}
	}

	return await resolve(event);
};
