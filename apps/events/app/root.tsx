import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/tiptap/styles.css';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import 'dayjs/locale/fi';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { AppLayout } from '~/components/AppLayout';
import { getSession } from '~/lib/session.server';
import { theme } from '~/theme';
import type { Route } from './+types/root';

export async function loader({ request }: { request: Request }) {
  const session = await getSession(request);
  if (!session) return { user: null };

  return {
    user: {
      nickname: session.user.nickname,
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bangers&display=swap"
          rel="stylesheet"
        />
        <ColorSchemeScript defaultColorScheme="auto" />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <DatesProvider settings={{ locale: 'fi', firstDayOfWeek: 1 }}>{children}</DatesProvider>
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
