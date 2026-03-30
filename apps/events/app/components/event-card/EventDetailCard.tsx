import type { EventDetail, Participant } from '@dt65/api-client';
import { Badge, Button, Card, Divider, Group, Modal, Stack, Text, Typography } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPencil, IconTrash, IconUser } from '@tabler/icons-react';
import { Link, useFetcher } from 'react-router';
import { EventImageHeader } from './EventImageHeader';
import { EventMeta } from './EventMeta';
import classes from './event-card.module.css';
import { JoinLeaveButton } from './JoinLeaveButton';

function ParticipantBadge({
  participant,
  isCurrentUser,
}: {
  participant: Participant;
  isCurrentUser: boolean;
}) {
  return (
    <Badge
      variant={isCurrentUser ? 'filled' : 'light'}
      color={isCurrentUser ? 'pink.3' : 'blue'}
      size="lg"
      leftSection={<IconUser size={12} />}
    >
      {participant.nickname}
    </Badge>
  );
}

interface EventDetailCardProps {
  event: EventDetail;
  currentNickname: string;
}

export function EventDetailCard({ event, currentNickname }: EventDetailCardProps) {
  const deleteFetcher = useFetcher();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure();

  const isParticipant = event.participants.some((p) => p.nickname === currentNickname);
  const isCreator = event.creator.nickname === currentNickname;
  const isDeleting = deleteFetcher.state !== 'idle';

  return (
    <>
      <Card shadow="sm" padding={0} radius="md" withBorder>
        <EventImageHeader
          title={event.title}
          type={event.type}
          race={event.race}
          creatorNickname={event.creator.nickname}
          participantCount={event.participants.length}
          isParticipant={isParticipant}
          imageHeight={220}
        />

        <Stack gap="xs" p="md">
          {event.subtitle && (
            <Text fw={600} size="md">
              {event.subtitle}
            </Text>
          )}

          <EventMeta
            dateStart={event.dateStart}
            timeStart={event.timeStart}
            location={event.location}
          />

          {event.description && event.description !== '<p></p>' && (
            <>
              <Divider my="xs" />
              <Typography>
                <div dangerouslySetInnerHTML={{ __html: event.description }} />
              </Typography>
            </>
          )}

          <Divider my="xs" label="Osallistujat" labelPosition="center" />

          {event.participants.length === 0 ? (
            <Text c="dimmed" ta="center" size="sm">
              Ei osallistujia
            </Text>
          ) : (
            <Group gap="xs">
              {event.participants.map((p) => (
                <ParticipantBadge
                  key={p.userId}
                  participant={p}
                  isCurrentUser={p.nickname === currentNickname}
                />
              ))}
            </Group>
          )}

          <div className={classes.footer}>
            <JoinLeaveButton eventId={event.id} isParticipant={isParticipant} />

            <Group gap="xs">
              <Button
                component={Link}
                to={`/events/${String(event.id)}/edit`}
                variant="subtle"
                size="compact-sm"
                leftSection={<IconPencil size={14} />}
              >
                Muokkaa
              </Button>
              {isCreator && (
                <Button
                  variant="subtle"
                  color="red"
                  size="compact-sm"
                  leftSection={<IconTrash size={14} />}
                  onClick={openDeleteModal}
                >
                  Poista
                </Button>
              )}
            </Group>
          </div>
        </Stack>
      </Card>

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Poista tapahtuma"
        centered
      >
        <Text mb="lg">Haluatko varmasti poistaa tapahtuman &quot;{event.title}&quot;?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDeleteModal}>
            Peruuta
          </Button>
          <deleteFetcher.Form method="post">
            <Button type="submit" name="intent" value="delete" color="red" loading={isDeleting}>
              Poista
            </Button>
          </deleteFetcher.Form>
        </Group>
      </Modal>
    </>
  );
}
