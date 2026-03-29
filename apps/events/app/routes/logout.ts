import { redirect } from 'react-router';
import { clearSessionCookie } from '~/lib/session.server';

export async function loader() {
  return redirect('/', {
    headers: { 'Set-Cookie': clearSessionCookie() },
  });
}
