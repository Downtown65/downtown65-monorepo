import type { EventSummary } from '@dt65/api-client';
import { getApiEvents } from '@dt65/api-client';
import { Badge, Button, Card, Container, Group, SimpleGrid, Text, Title } from '@mantine/core';
import { IconCalendarEvent, IconMapPin, IconTrophy, IconUsers } from '@tabler/icons-react';
import { Link } from 'react-router';
import { createAuthClient, requireAuth } from '~/lib/api.server';
import type { Route } from './+types/events';

export async function loader({ request }: { request: Request }) {
  const session = await requireAuth(request);
  const { apiClient } = await createAuthClient(session);
  const { data } = await getApiEvents({ client: apiClient });
  return { events: data ?? [] };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  return `klo ${timeStr.slice(0, 5)}`;
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function EventCard({ event }: { event: EventSummary }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={500} lineClamp={1}>
          {event.title}
        </Text>
        {event.race && (
          <Badge color="yellow" variant="light" leftSection={<IconTrophy size={12} />}>
            Kilpailu
          </Badge>
        )}
      </Group>

      <Badge variant="light" mb="sm">
        {formatEventType(event.type)}
      </Badge>

      <Group gap="xs" mb="xs">
        <IconCalendarEvent size={14} />
        <Text size="sm" c="dimmed">
          {formatDate(event.dateStart)}
          {event.timeStart ? ` ${formatTime(event.timeStart)}` : ''}
        </Text>
      </Group>

      {event.location && (
        <Group gap="xs" mb="xs">
          <IconMapPin size={14} />
          <Text size="sm" c="dimmed">
            {event.location}
          </Text>
        </Group>
      )}

      <Group gap="xs" mb="md">
        <IconUsers size={14} />
        <Text size="sm" c="dimmed">
          {String(event.participantCount)} osallistujaa
        </Text>
      </Group>

      <Button
        component={Link}
        to={`/events/${String(event.id)}`}
        variant="light"
        fullWidth
        mt="auto"
      >
        Näytä lisää
      </Button>
    </Card>
  );
}

export default function Events({ loaderData }: Route.ComponentProps) {
  const { events } = loaderData;

  return (
    <Container size="lg">
      <Group justify="space-between" mb="md">
        <Title order={2}>Tapahtumat</Title>
        <Button component={Link} to="/events/new" leftSection={<IconCalendarEvent size={16} />}>
          Luo uusi
        </Button>
      </Group>

      {events.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Ei tulevia tapahtumia.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
