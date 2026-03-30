import type { EventSummary } from '@dt65/api-client';
import { Button, Card, Stack, Text } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router';
import { EventImageHeader } from './EventImageHeader';
import { EventMeta } from './EventMeta';
import classes from './event-card.module.css';
import { JoinLeaveButton } from './JoinLeaveButton';

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Card shadow="sm" padding={0} radius="md" withBorder className={classes.card}>
      <EventImageHeader
        title={event.title}
        type={event.type}
        race={event.race ?? false}
        creatorNickname={event.creator.nickname}
        participantCount={event.participantCount}
        isParticipant={event.isParticipant ?? false}
        imageHeight={180}
      />

      <Stack gap="xs" p="md" style={{ flex: 1 }}>
        {event.subtitle && (
          <Text fw={600} size="md" lineClamp={2}>
            {event.subtitle}
          </Text>
        )}

        <EventMeta
          dateStart={event.dateStart}
          timeStart={event.timeStart}
          location={event.location}
        />

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
          <JoinLeaveButton eventId={event.id} isParticipant={event.isParticipant ?? false} />
        </div>
      </Stack>
    </Card>
  );
}
