import { redirect } from 'react-router';
import { exchangeCode, getUserInfo, type SessionData, SessionDataSchema } from '~/lib/auth.server';
import { clearPkceCookie, createSessionCookie, getPkceData } from '~/lib/session.server';

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    const description = url.searchParams.get('error_description') ?? 'Authentication failed';
    throw new Response(description, { status: 401 });
  }

  if (!(code && state)) {
    throw new Response('Missing code or state', { status: 400 });
  }

  const pkceData = await getPkceData(request);
  if (!pkceData || pkceData.state !== state) {
    throw new Response('Invalid state parameter', { status: 400 });
  }

  const tokens = await exchangeCode(request, code, pkceData.codeVerifier);
  const user = await getUserInfo(tokens.access_token);

  const session: SessionData = SessionDataSchema.encode({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    user,
  });

  const sessionCookie = await createSessionCookie(session);
  const clearPkce = clearPkceCookie();

  return redirect('/events', {
    headers: [
      ['Set-Cookie', sessionCookie],
      ['Set-Cookie', clearPkce],
    ],
  });
}
