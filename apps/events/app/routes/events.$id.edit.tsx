import { Container, Title } from '@mantine/core';
import { redirect, useLoaderData, useNavigation } from 'react-router';
import { EventWizard } from '~/components/event-wizard/EventWizard';
import type { EventFormData } from '~/components/event-wizard/types';
import { apiGet, apiPut, requireAuth } from '~/lib/api.server';

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
}

export async function loader({ request, params }: { request: Request; params: { id: string } }) {
  const session = await requireAuth(request);
  const { data } = await apiGet(session, `/events/${params.id}`);
  const event = data as EventDetail;

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
  const formData = await request.formData();
  const data = JSON.parse(formData.get('data') as string) as EventFormData;

  await apiPut(session, `/events/${params.id}`, {
    type: data.eventType,
    title: data.title.trim(),
    dateStart: data.dateStart,
    timeStart: data.timeStart ?? undefined,
    location: data.location || undefined,
    subtitle: data.subtitle || undefined,
    description: data.description || undefined,
    race: data.race,
  });

  return redirect(`/events/${params.id}`);
}

export default function EditEvent() {
  const { eventId, formData } = useLoaderData<typeof loader>();
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
