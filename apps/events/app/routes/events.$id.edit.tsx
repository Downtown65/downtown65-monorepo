import { getApiEventsById, putApiEventsById } from '@dt65/api-client';
import { Container, Title } from '@mantine/core';
import { redirect, useLoaderData, useNavigation } from 'react-router';
import { EventWizard } from '~/components/event-wizard/EventWizard';
import type { EventFormData } from '~/components/event-wizard/types';
import { createAuthClient, requireAuth } from '~/lib/api.server';

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const session = await requireAuth(request);
  const { apiClient } = await createAuthClient(session);
  const { data: event } = await getApiEventsById({ client: apiClient, path: { id: params.id } });

  if (!event) {
    throw new Response('Not found', { status: 404 });
  }

  const formData: EventFormData = {
    eventType: event.type as EventFormData['eventType'],
    title: event.title,
    dateStart: event.dateStart,
    timeStart: event.timeStart,
    location: event.location ?? '',
    subtitle: event.subtitle ?? '',
    description: event.description ?? '',
    race: event.race,
  };

  return { eventId: event.id, formData };
}

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const session = await requireAuth(request);
  const { apiClient } = await createAuthClient(session);
  const formData = await request.formData();
  const data = JSON.parse(formData.get('data') as string) as EventFormData;

  await putApiEventsById({
    client: apiClient,
    path: { id: params.id },
    body: {
      type: data.eventType!,
      title: data.title.trim(),
      dateStart: data.dateStart,
      timeStart: data.timeStart ?? undefined,
      location: data.location || undefined,
      subtitle: data.subtitle || undefined,
      description: data.description || undefined,
      race: data.race,
    },
  });

  return redirect(`/events/${params.id}`);
}

export default function EditEvent() {
  const { formData } = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  function handleSubmit(data: EventFormData) {
    const form = document.createElement('form');
    form.method = 'POST';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'data';
    input.value = JSON.stringify(data);
    form.appendChild(input);
    document.body.appendChild(form);
    form.requestSubmit();
    document.body.removeChild(form);
  }

  return (
    <Container size="md">
      <Title order={2} mb="lg">
        Muokkaa tapahtumaa
      </Title>
      <EventWizard
        initialData={formData}
        onSubmit={handleSubmit}
        isSubmitting={navigation.state === 'submitting'}
        submitLabel="Tallenna"
      />
    </Container>
  );
}
