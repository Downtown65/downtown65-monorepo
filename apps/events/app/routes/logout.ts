import { redirect } from 'react-router';
import { getLogoutUrl } from '~/lib/auth.server';
import { clearSessionCookie } from '~/lib/session.server';

export async function loader({ request }: { request: Request }) {
  const logoutUrl = getLogoutUrl(request);

  return redirect(logoutUrl, {
    headers: { 'Set-Cookie': clearSessionCookie() },
  });
}
