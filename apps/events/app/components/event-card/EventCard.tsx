import type { EventSummary } from '@dt65/api-client';
import { ActionIcon, Badge, Button, Card, Group, Image, Stack, Text } from '@mantine/core';
import {
  IconArrowRight,
  IconCalendarEvent,
  IconMapPin,
  IconTrophy,
  IconUsers,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Link } from 'react-router';
import { getEventTypeInfo } from '~/lib/event-type-map';
import classes from './EventCard.module.css';

function formatDateTime(isoDate: string, isoTime: string | null): string {
  const d = parseISO(isoDate);
  const date = format(d, 'd.M.yyyy (EEEEEE)', { locale: fi });
  const time = isoTime != null ? `klo ${isoTime}` : '';

  return `${date} ${time}`;
}

export function EventCard({ event }: { event: EventSummary }) {
  const typeInfo = getEventTypeInfo(event.type);

  return (
    <Card shadow="sm" padding={0} radius="md" withBorder className={classes.card}>
      <Card.Section className={classes.imageSection}>
        <Image src={typeInfo.image} height={180} alt={event.title} />
        <div className={classes.imageOverlay}>
          <Text className={classes.imageTitle} size="xl" fw={700}>
            {event.title}
          </Text>
          <Group gap="xs" mt={4}>
            <Badge
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
              radius="xs"
              size="sm"
              leftSection={<typeInfo.icon size={14} />}
            >
              {typeInfo.label}
            </Badge>
            {event.race && (
              <Badge
                variant="gradient"
                gradient={{ from: 'orange', to: 'red' }}
                radius="xs"
                size="sm"
                leftSection={<IconTrophy size={12} />}
              >
                Kilpailu
              </Badge>
            )}
          </Group>
        </div>
        <Badge
          className={classes.imageTopRight}
          size="md"
          radius="xs"
          leftSection={<IconUsers size={14} />}
        >
          {event.participantCount}
        </Badge>
      </Card.Section>

      <Stack gap="xs" p="md" style={{ flex: 1 }}>
        <Text fw={600} size="md" lineClamp={2}>
          {event.subtitle}
        </Text>

        <div className={classes.metaRow}>
          <IconCalendarEvent size={14} className={classes.metaIcon} />
          <Text size="sm">{formatDateTime(event.dateStart, event.timeStart)}</Text>
        </div>

        <div className={classes.metaRow}>
          <IconMapPin size={14} className={classes.metaIcon} />
          <Text size="sm" c="dimmed">
            {event.location}
          </Text>
        </div>

        <Text size="xs" c="dimmed">
          event lead: {event.creator.nickname}
        </Text>

        <div className={classes.footer}>
          <Button
            component={Link}
            to={`/events/${String(event.id)}`}
            variant="subtle"
            size="compact-sm"
            rightSection={<IconArrowRight size={14} />}
          >
            Näytä lisää
          </Button>
          <Button variant="solid" size="sm" leftSection={<IconUsers size={14} />}>
            Osallistun
          </Button>
        </div>
      </Stack>
    </Card>
  );
}
