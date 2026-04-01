import { getApiAuthMe } from '@dt65/api-client';
import { Avatar, Badge, Card, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconBell, IconMail } from '@tabler/icons-react';
import { data as routeData } from 'react-router';
import { ThemeToggle } from '~/components/ThemeToggle';
import { createAuthClient, requireAuth } from '~/lib/api.server';
import type { Route } from './+types/profile';

export async function loader({ request }: { request: Request }) {
  const session = await requireAuth(request);
  const { apiClient, headers } = await createAuthClient(session);
  const { data: profile } = await getApiAuthMe({ client: apiClient });

  return routeData({ profile }, { headers });
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { profile } = loaderData;

  if (!profile) {
    return (
      <Container size="sm">
        <Text c="red">Profiilin lataaminen epäonnistui.</Text>
      </Container>
    );
  }

  return (
    <Container size="sm">
      <Title order={2} mb="lg">
        Profiili
      </Title>

      <Stack gap="md">
        <Paper radius="md" withBorder p="lg" bg="var(--mantine-color-body)">
          <Avatar src={profile.picture} size={120} radius={120} mx="auto" alt={profile.nickname} />
          <Text ta="center" fz="lg" fw={500} mt="md">
            {profile.name}
          </Text>
          <Text ta="center" c="dimmed" fz="sm">
            {profile.nickname} &bull; {profile.email}
          </Text>
        </Paper>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Text fw={600} mb="sm">
            Ilmoitukset
          </Text>
          <Stack gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <IconMail size={16} />
                <Text size="sm">Uudet tapahtumat</Text>
              </Group>
              <Badge color={profile.subscribeEventCreationEmail ? 'green' : 'gray'}>
                {profile.subscribeEventCreationEmail ? 'Päällä' : 'Pois'}
              </Badge>
            </Group>
            <Group justify="space-between">
              <Group gap="xs">
                <IconBell size={16} />
                <Text size="sm">Viikkokooste</Text>
              </Group>
              <Badge color={profile.subscribeWeeklyEmail ? 'green' : 'gray'}>
                {profile.subscribeWeeklyEmail ? 'Päällä' : 'Pois'}
              </Badge>
            </Group>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <Text fw={600}>Teema</Text>
            <ThemeToggle />
          </Group>
        </Card>
      </Stack>
    </Container>
  );
}
