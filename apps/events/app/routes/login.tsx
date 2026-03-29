import { client, postApiAuthLogin } from '@dt65/api-client';
import {
  Alert,
  Anchor,
  Button,
  Container,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Form, Link, redirect, useNavigation } from 'react-router';
import { ENV } from 'varlock/env';
import { type SessionData, SessionDataSchema } from '~/lib/auth.server';
import { createSessionCookie } from '~/lib/session.server';
import type { Route } from './+types/login';

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = 'Sähköposti vaaditaan';
  if (!password) fieldErrors.password = 'Salasana vaaditaan';

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  client.setConfig({
    baseUrl: ENV.API_BASE_URL,
    headers: { 'x-api-key': ENV.X_API_KEY },
  });

  const { data, error } = await postApiAuthLogin({
    client,
    body: { email, password },
  });

  if (error || !data) {
    return { error: 'Virheellinen sähköposti tai salasana' };
  }

  const session: SessionData = SessionDataSchema.encode({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
    user: data.user,
  });

  const sessionCookie = await createSessionCookie(session);

  return redirect('/events', {
    headers: { 'Set-Cookie': sessionCookie },
  });
}

export default function Login({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Container size={420} py={40}>
      <Title ta="center">Kirjaudu sisään</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Downtown65 tapahtumat
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {actionData?.error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
            {actionData.error}
          </Alert>
        )}

        <Form method="post">
          <TextInput
            label="Sähköposti"
            placeholder="me@downtown65.com"
            name="email"
            type="email"
            required
            error={actionData?.fieldErrors?.email}
          />
          <PasswordInput
            label="Salasana"
            placeholder="Salasanasi"
            name="password"
            required
            mt="md"
            error={actionData?.fieldErrors?.password}
          />

          <Button type="submit" fullWidth mt="xl" loading={isSubmitting}>
            Kirjaudu
          </Button>
        </Form>

        <Text ta="right" mt="md" size="sm">
          <Anchor component={Link} to="/forgot-password">
            Unohditko salasanan?
          </Anchor>
        </Text>
        <Text ta="right" mt={4} size="sm">
          <Anchor component={Link} to="/signup">
            Rekisteröidy
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
