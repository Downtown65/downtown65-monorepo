import { deleteApiEventsByIdParticipants, postApiEventsByIdParticipants } from '@dt65/api-client';
import { createAuthClient, requireAuth } from '~/lib/api.server';

export async function action({ request, params }: { request: Request; params: { id: string } }) {
  const session = await requireAuth(request);
  const { apiClient } = await createAuthClient(session);
  const formData = await request.formData();
  const intent = String(formData.get('intent'));

  if (intent === 'join') {
    await postApiEventsByIdParticipants({ client: apiClient, path: { id: params.id } });
  } else if (intent === 'leave') {
    await deleteApiEventsByIdParticipants({ client: apiClient, path: { id: params.id } });
  }

  return { ok: true };
}
