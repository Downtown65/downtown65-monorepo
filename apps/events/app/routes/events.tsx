import { getApiEvents } from '@dt65/api-client';
import { Button, Container, Group, SimpleGrid, Text, Title } from '@mantine/core';
import { IconCalendarEvent } from '@tabler/icons-react';
import { Link } from 'react-router';
import { EventCard } from '~/components/event-card/EventCard';
import { createAuthClient, requireAuth } from '~/lib/api.server';
import type { Route } from './+types/events';

export async function loader({ request }: { request: Request }) {
  const session = await requireAuth(request);
  const { apiClient } = await createAuthClient(session);
  const { data } = await getApiEvents({ client: apiClient });
  return { events: data ?? [] };
}

export default function Events({ loaderData }: Route.ComponentProps) {
  const { events } = loaderData;

  return (
    <Container size="lg">
      {events.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Ei tulevia tapahtumia.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xs">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
