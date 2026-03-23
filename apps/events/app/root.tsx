import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router';
import { AppLayout } from '~/components/AppLayout';
import { getSession } from '~/lib/session.server';
import { theme } from '~/theme';

export interface RootLoaderData {
  user: { nickname: string; email?: string | undefined } | null;
}

export async function loader({ request }: { request: Request }): Promise<RootLoaderData> {
  const session = await getSession(request);
  if (!session) return { user: null };

  return {
    user: {
      nickname: session.user.nickname ?? session.user.email ?? 'Käyttäjä',
      email: session.user.email,
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

export default function Root() {
  const { user } = useLoaderData<RootLoaderData>();

  return (
    <AppLayout user={user}>
      <Outlet />
    </AppLayout>
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
