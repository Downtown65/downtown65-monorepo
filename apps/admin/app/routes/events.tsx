import { Container, Text, Title } from '@mantine/core';
import { useLoaderData } from 'react-router';
import { apiGet, requireAdmin } from '~/lib/api.server';

interface PaginatedEvents {
  events: Array<{
    id: number;
    title: string;
    dateStart: string;
    timeStart: string | null;
    eventType: string;
    location: string | null;
    race: boolean;
    creatorNickname: string;
    participantCount: number;
    createdAt: string;
  }>;
  total: number;
  page: number;
  perPage: number;
}

export async function loader({ request }: { request: Request }) {
  const session = await requireAdmin(request);
  const url = new URL(request.url);
  const page = url.searchParams.get('page') ?? '1';
  const { data } = await apiGet(session, `/admin/events?page=${page}`);
  return data as PaginatedEvents;
}

export default function Events() {
  const { events, total } = useLoaderData<typeof loader>();

  return (
    <Container size="lg">
      <Title order={2} mb="md">
        Tapahtumat
      </Title>
      <Text c="dimmed">
        {String(events.length)} / {String(total)} tapahtumaa
      </Text>
    </Container>
  );
}
