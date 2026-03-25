import type { EventSummary } from '@dt65/api-client';
import { ActionIcon, Badge, Button, Card, Group, Image, Text } from '@mantine/core';
import { IconCalendarEvent, IconMapPin, IconTrophy, IconUsers } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';

import { Link } from 'react-router';
import classes from './EventCard.module.css';

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatDateTime(isoDate: string, isotime: string | null): string {
  const d = parseISO(isoDate);
  const date = format(d, 'd.M.yyyy (EEEEEE)', { locale: fi });
  const time = isotime != null ? `klo ${isotime}` : '';

  return `${date} ${time}`;
}

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section className={classes.imageSection}>
        <Image src="/event-images/hockey.jpg" height={160} alt="Norway" />
        <div className={classes.imageOverlay}>
          <Badge
            size="md"
            radius="xs"
            className={classes.participantCount}
            leftSection={<IconUsers size={14} />}
          >
            {event.participantCount}
          </Badge>

          {/* Center - title */}
          <Text className={classes.title} size="xl" fw={700}>
            {event.title}
          </Text>

          {/* Bottom left - badge */}
          <Badge
            className={classes.type}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            radius="xs"
          >
            {formatEventType(event.type)}
          </Badge>

          <ActionIcon
            variant="gradient"
            size="md"
            aria-label="Gradient action icon"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
          >
            <IconTrophy size={18} />
          </ActionIcon>

          <Badge
            className={classes.author}
            variant="gradient"
            gradient={{ from: 'violet', to: 'indigo', deg: 90 }}
            radius="xs"
            tt="none"
          >
            by #{event.creator.nickname}
          </Badge>
        </div>
      </Card.Section>
      <Text fw="bold" mt="xs">
        {event.subtitle}
      </Text>
      <Group>
        <IconCalendarEvent size={14} />
        <Text size="sm">{formatDateTime(event.dateStart, event.timeStart)}</Text>
      </Group>
      <Group>
        <IconMapPin size={14} />
        <Text size="sm" c="dimmed">
          {event.location ?? 'Ei määritelty'}
        </Text>
      </Group>
      <Button
        my="sm"
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
