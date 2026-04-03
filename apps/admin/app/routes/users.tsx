import { getApiAdminUsers } from '@dt65/api-client';
import { Container, Text, Title } from '@mantine/core';
import { data } from 'react-router';
import { createAuthClient, requireAdmin } from '~/lib/api.server';
import type { Route } from './+types/users';

export async function loader({ request }: { request: Request }) {
  const session = await requireAdmin(request);
  const { apiClient, headers } = await createAuthClient(session);

  const { data: users } = await getApiAdminUsers({ client: apiClient });

  if (!users) {
    throw new Response('Failed to fetch users', { status: 500 });
  }

  if (headers.has('Set-Cookie')) {
    return data({ users }, { headers });
  }

  return { users };
}

export default function Users({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;

  return (
    <Container size="lg">
      <Title order={2} mb="md">
        Jäsenet
      </Title>
      <Text c="dimmed">{String(users.length)} jäsentä</Text>
    </Container>
  );
}
