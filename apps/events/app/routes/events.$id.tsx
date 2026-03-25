import type { Participant } from '@dt65/api-client';
import {
  deleteApiEventsById,
  deleteApiEventsByIdParticipants,
  getApiEventsById,
  postApiEventsByIdParticipants,
} from '@dt65/api-client';
import {
  Badge,
  Button,
  Container,
  Divider,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
  Typography,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendarEvent,
  IconHandOff,
  IconHandStop,
  IconMapPin,
  IconPencil,
  IconTrash,
  IconTrophy,
  IconUser,
} from '@tabler/icons-react';
import { Link, redirect, useFetcher } from 'react-router';
import { createAuthClient, requireAuth } from '~/lib/api.server';
import { getSession } from '~/lib/session.server';
import type { Route } from './+types/events.$id';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fi-FI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr: string | null): string | null {
  if (!timeStr) return null;
  return `klo ${timeStr.slice(0, 5)}`;
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const session = await getSession(request);
  const authSession = session ? { ...session } : await requireAuth(request);
  const { apiClient } = await createAuthClient(authSession);
  const { data: event } = await getApiEventsById({ client: apiClient, path: { id: params.id } });

  if (!event) {
    throw new Response('Not found', { status: 404 });
  }

  const currentNickname = session?.user.nickname ?? null;

  return { event, currentNickname };
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const session = await requireAuth(request);
  const { apiClient } = await createAuthClient(session);
  const formData = await request.formData();
  const intent = String(formData.get('intent'));

  if (intent === 'join') {
    await postApiEventsByIdParticipants({ client: apiClient, path: { id: params.id } });
  } else if (intent === 'leave') {
    await deleteApiEventsByIdParticipants({ client: apiClient, path: { id: params.id } });
  } else if (intent === 'delete') {
    await deleteApiEventsById({ client: apiClient, path: { id: params.id } });
    return redirect('/events');
  }

  return { ok: true };
}

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
      color={isCurrentUser ? 'pink' : 'blue'}
      size="lg"
      leftSection={<IconUser size={12} />}
    >
      {participant.nickname}
    </Badge>
  );
}

export default function EventDetailPage({ loaderData }: Route.ComponentProps) {
  const { event, currentNickname } = loaderData;
  const fetcher = useFetcher();
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure();

  const isParticipant = event.participants.some((p) => p.nickname === currentNickname);
  const isLoggedIn = currentNickname !== null;
  const isSubmitting = fetcher.state !== 'idle';

  return (
    <Container size="md">
      <Paper shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="space-between" mb="xs">
          <Title order={2}>{event.title}</Title>
          {event.race && (
            <Badge color="yellow" variant="light" size="lg" leftSection={<IconTrophy size={14} />}>
              Kilpailu
            </Badge>
          )}
        </Group>

        {event.subtitle && (
          <Text fw={500} size="lg" mb="sm">
            {event.subtitle}
          </Text>
        )}

        <Badge variant="light" mb="md">
          {formatEventType(event.type)}
        </Badge>

        <Stack gap="xs" mb="md">
          <Group gap="xs">
            <IconCalendarEvent size={16} />
            <Text>
              {formatDate(event.dateStart)}
              {event.timeStart ? ` ${formatTime(event.timeStart)}` : ''}
            </Text>
          </Group>

          {event.location && (
            <Group gap="xs">
              <IconMapPin size={16} />
              <Text>{event.location}</Text>
            </Group>
          )}
        </Stack>

        {event.description && (
          <>
            <Divider my="md" />
            <Typography>
              <div dangerouslySetInnerHTML={{ __html: event.description }} />
            </Typography>
          </>
        )}

        <Divider my="md" label="Osallistujat" labelPosition="center" />

        {event.participants.length === 0 ? (
          <Text c="dimmed" ta="center" py="sm">
            Tapahtumassa ei osallistujia
          </Text>
        ) : (
          <Group gap="xs" mb="md">
            {event.participants.map((p) => (
              <ParticipantBadge
                key={p.userId}
                participant={p}
                isCurrentUser={p.nickname === currentNickname}
              />
            ))}
          </Group>
        )}

        <fetcher.Form method="post">
          {isParticipant ? (
            <Button
              type="submit"
              name="intent"
              value="leave"
              color="red"
              variant="light"
              leftSection={<IconHandOff size={16} />}
              loading={isSubmitting}
              w={140}
            >
              Poistu
            </Button>
          ) : (
            <Button
              type="submit"
              name="intent"
              value="join"
              leftSection={<IconHandStop size={16} />}
              loading={isSubmitting}
              w={140}
            >
              Osallistu
            </Button>
          )}
        </fetcher.Form>

        {isLoggedIn && (
          <>
            <Divider my="md" />

            <Group>
              <Button
                component={Link}
                to={`/events/${String(event.id)}/edit`}
                variant="subtle"
                leftSection={<IconPencil size={16} />}
              >
                Muokkaa
              </Button>
              <Button
                variant="subtle"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={openDeleteModal}
              >
                Poista
              </Button>
            </Group>
          </>
        )}
      </Paper>

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
          <fetcher.Form method="post">
            <Button type="submit" name="intent" value="delete" color="red" loading={isSubmitting}>
              Poista
            </Button>
          </fetcher.Form>
        </Group>
      </Modal>
    </Container>
  );
}
