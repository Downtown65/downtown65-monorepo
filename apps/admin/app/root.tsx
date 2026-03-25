import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { AdminLayout } from '~/components/AdminLayout';
import { getSession } from '~/lib/session.server';
import { theme } from '~/theme';

export async function loader({ request }: { request: Request }) {
  const session = await getSession(request);
  if (!session) return { user: null };

  return {
    user: {
      nickname: session.user.nickname,
      role: session.user.role,
    },
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ColorSchemeScript defaultColorScheme="auto" />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          {children}
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <AdminLayout user={user}>
      <Outlet />
    </AdminLayout>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  if (isRouteErrorResponse(error)) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h1>{String(error.status)}</h1>
        <p>{error.statusText}</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>Virhe</h1>
      <p>Jotain meni pieleen.</p>
    </div>
  );
}
