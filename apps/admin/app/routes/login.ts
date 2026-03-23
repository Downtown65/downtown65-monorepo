import { redirect } from 'react-router';
import { getLoginUrl } from '~/lib/auth.server';
import { createPkceCookie } from '~/lib/session.server';

export async function loader({ request }: { request: Request }) {
  const { url, codeVerifier, state } = await getLoginUrl(request);
  const pkceCookie = await createPkceCookie({ codeVerifier, state });

  return redirect(url, {
    headers: { 'Set-Cookie': pkceCookie },
  });
}
