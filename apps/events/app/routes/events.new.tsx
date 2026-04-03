import { postApiEvents } from '@dt65/api-client';
import { Container, Title } from '@mantine/core';
import { redirect, useNavigation } from 'react-router';
import { EventWizard } from '~/components/event-wizard/EventWizard';
import { type EventFormData, EventFormDataSchema } from '~/components/event-wizard/types';
import { createAuthClient, requireAuth } from '~/lib/api.server';

export async function action({ request }: { request: Request }) {
  const session = await requireAuth(request);
  const { apiClient, headers } = await createAuthClient(session);
  const formData = await request.formData();
  const data = EventFormDataSchema.parse(JSON.parse(String(formData.get('data'))));

  await postApiEvents({
    client: apiClient,
    body: {
      type: data.eventType,
      title: data.title.trim(),
      dateStart: data.dateStart,
      timeStart: data.timeStart ?? undefined,
      location: data.location.trim(),
      subtitle: data.subtitle.trim(),
      description: data.description || undefined,
      race: data.race,
    },
  });

  return redirect('/events', { headers });
}

export default function NewEvent() {
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
        Luo uusi tapahtuma
      </Title>
      <EventWizard onSubmit={handleSubmit} isSubmitting={navigation.state === 'submitting'} />
    </Container>
  );
}
