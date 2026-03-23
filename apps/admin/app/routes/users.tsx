import { Container, Text, Title } from '@mantine/core';
import { useLoaderData } from 'react-router';
import { apiGet, requireAdmin } from '~/lib/api.server';

interface AdminUser {
  userId: string;
  email: string;
  name: string;
  nickname: string;
  picture: string;
  role: string;
  blocked: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export async function loader({ request }: { request: Request }) {
  const session = await requireAdmin(request);
  const { data } = await apiGet(session, '/admin/users');
  return { users: data as AdminUser[] };
}

export default function Users() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <Container size="lg">
      <Title order={2} mb="md">
        Jäsenet
      </Title>
      <Text c="dimmed">{String(users.length)} jäsentä</Text>
    </Container>
  );
}
