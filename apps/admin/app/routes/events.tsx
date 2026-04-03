import { getApiAdminEvents } from '@dt65/api-client';
import { Container, Text, Title } from '@mantine/core';
import { data } from 'react-router';
import { createAuthClient, requireAdmin } from '~/lib/api.server';
import type { Route } from './+types/events';

export async function loader({ request }: { request: Request }) {
  const session = await requireAdmin(request);
  const { apiClient, headers } = await createAuthClient(session);
  const url = new URL(request.url);
  const page = url.searchParams.get('page') ?? '1';

  const { data: events } = await getApiAdminEvents({
    client: apiClient,
    query: { page, perPage: '20' },
  });

  if (!events) {
    throw new Response('Failed to fetch events', { status: 500 });
  }

  if (headers.has('Set-Cookie')) {
    return data(events, { headers });
  }

  return events;
}

export default function Events({ loaderData }: Route.ComponentProps) {
  const { events, total } = loaderData;

  return (
    <Container size="lg">
      <Title order={2} mb="md">
        Tapahtumat
      </Title>
      <Text c="dimmed">
        {String(events.length)} / {String(total)} tapahtumaa
      </Text>
    </Container>
  );
}
