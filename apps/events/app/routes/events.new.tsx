import { Container, Title } from '@mantine/core';
import { redirect, useNavigation } from 'react-router';
import { EventWizard } from '~/components/event-wizard/EventWizard';
import type { EventFormData } from '~/components/event-wizard/types';
import { apiPost, requireAuth } from '~/lib/api.server';

export async function action({ request }: { request: Request }) {
  const session = await requireAuth(request);
  const formData = await request.formData();
  const data = JSON.parse(formData.get('data') as string) as EventFormData;

  await apiPost(session, '/events', {
    type: data.eventType,
    title: data.title.trim(),
    dateStart: data.dateStart,
    timeStart: data.timeStart ?? undefined,
    location: data.location || undefined,
    subtitle: data.subtitle || undefined,
    description: data.description || undefined,
    race: data.race,
  });

  return redirect('/events');
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
