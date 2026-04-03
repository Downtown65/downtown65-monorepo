import { deleteApiEventsById, getApiEventsById } from '@dt65/api-client';
import { Container } from '@mantine/core';
import { redirect, data as routeData } from 'react-router';
import { EventDetailCard } from '~/components/event-card/EventDetailCard';
import { createAuthClient, requireAuth } from '~/lib/api.server';
import type { Route } from './+types/events.$id';

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const session = await requireAuth(request);
  const { apiClient, headers } = await createAuthClient(session);
  const { data: event } = await getApiEventsById({ client: apiClient, path: { id: params.id } });

  if (!event) {
    throw new Response('Not found', { status: 404 });
  }

  const currentNickname = session.user.nickname;

  return routeData({ event, currentNickname }, { headers });
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const session = await requireAuth(request);
  const { apiClient, headers } = await createAuthClient(session);
  const formData = await request.formData();
  const intent = String(formData.get('intent'));

  if (intent === 'delete') {
    await deleteApiEventsById({ client: apiClient, path: { id: params.id } });
    return redirect('/events', { headers });
  }

  return routeData({ ok: true }, { headers });
}

export default function EventDetailPage({ loaderData }: Route.ComponentProps) {
  const { event, currentNickname } = loaderData;

  return (
    <Container size="sm">
      <EventDetailCard event={event} currentNickname={currentNickname} />
    </Container>
  );
}
