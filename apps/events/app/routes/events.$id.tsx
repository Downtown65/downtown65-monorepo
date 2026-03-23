import {
  Badge,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  TypographyStylesProvider,
} from '@mantine/core';
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
import { Link, useFetcher, useLoaderData } from 'react-router';
import { apiDelete, apiGet, apiPost, requireAuth } from '~/lib/api.server';
import { getSession } from '~/lib/session.server';

interface Participant {
  userId: number;
  nickname: string;
  joinedAt: string;
}

interface EventDetail {
  id: number;
  type: string;
  title: string;
  dateStart: string;
  timeStart: string | null;
  location: string | null;
  subtitle: string | null;
  description: string | null;
  race: boolean;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
}

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
  const { data } = await apiGet(
    session ? { ...session } : await requireAuth(request),
    `/events/${params.id}`,
  );
  const event = data as EventDetail;

  // Determine current user's nickname from session to check participation
  const currentNickname = session?.user.nickname ?? null;

  return { event, currentNickname };
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const session = await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

  if (intent === 'join') {
    await apiPost(session, `/events/${params.id}/participants`, {});
  } else if (intent === 'leave') {
    await apiDelete(session, `/events/${params.id}/participants`);
  } else if (intent === 'delete') {
    await apiDelete(session, `/events/${params.id}`);
    const { redirect } = await import('react-router');
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

export default function EventDetailPage() {
  const { event, currentNickname } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const isParticipant = event.participants.some((p) => p.nickname === currentNickname);
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
              {formatTime(event.timeStart) ? ` ${formatTime(event.timeStart)}` : ''}
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
            <TypographyStylesProvider>
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: event descriptions are HTML from tiptap editor */}
              <div dangerouslySetInnerHTML={{ __html: event.description }} />
            </TypographyStylesProvider>
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
          <fetcher.Form method="post">
            <Button
              type="submit"
              name="intent"
              value="delete"
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={16} />}
              loading={isSubmitting}
            >
              Poista
            </Button>
          </fetcher.Form>
        </Group>
        <Text size="xs" c="dimmed" mt="xs">
          Vain tapahtuman luoja voi muokata tai poistaa tapahtuman.
        </Text>
      </Paper>
    </Container>
  );
}
