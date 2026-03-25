import type { EventSummary } from '@dt65/api-client';
import { Badge, Button, Card, Group, Text } from '@mantine/core';
import { IconCalendarEvent, IconMapPin, IconTrophy, IconUsers } from '@tabler/icons-react';
import { Link } from 'react-router';

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) {
    return '';
  }

  return `klo ${timeStr.slice(0, 5)}`;
}

export function EventCard({ event }: { event: EventSummary }) {
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
          {formatTime(event.timeStart)}
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
