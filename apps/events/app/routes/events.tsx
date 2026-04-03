import { getApiEvents } from '@dt65/api-client';
import { Button, Container, SimpleGrid, Stack, Text } from '@mantine/core';
import { Link, data as routeData } from 'react-router';
import { EventCard } from '~/components/event-card/EventCard';
import { createAuthClient, requireAuth } from '~/lib/api.server';
import type { Route } from './+types/events';

export async function loader({ request }: { request: Request }) {
  const session = await requireAuth(request);
  const { apiClient, headers } = await createAuthClient(session);
  const { data } = await getApiEvents({ client: apiClient });
  return routeData({ events: data ?? [] }, { headers });
}

export default function Events({ loaderData }: Route.ComponentProps) {
  const { events } = loaderData;

  return (
    <Container size="lg">
      {events.length === 0 ? (
        <Stack align="center" py="xl">
          <Text c="dimmed">Ei tulevia tapahtumia.</Text>
          <Button component={Link} to="/events/new" size="xl">
            Luo tapahtuma
          </Button>
        </Stack>
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
