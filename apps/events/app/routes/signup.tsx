import { client, postApiAuthSignup } from '@dt65/api-client';
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
import { z } from 'zod/v4';
import { type SessionData, SessionDataSchema } from '~/lib/auth.server';
import { createSessionCookie } from '~/lib/session.server';
import type { Route } from './+types/signup';

const SignupFormSchema = z.object({
  email: z.email('Sähköposti vaaditaan'),
  password: z.string().min(8, 'Salasanan on oltava vähintään 8 merkkiä'),
  name: z.string().min(1, 'Nimi vaaditaan'),
  nickname: z.string().min(1, 'Nickname vaaditaan'),
  registerSecret: z.string().min(1, 'Rekisteröintitunnus vaaditaan'),
});

function parseFormData(formData: FormData) {
  return {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
    name: String(formData.get('name') ?? ''),
    nickname: String(formData.get('nickname') ?? ''),
    registerSecret: String(formData.get('registerSecret') ?? ''),
  };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const result = SignupFormSchema.safeParse(parseFormData(formData));

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string') {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const { email, password, name, nickname, registerSecret } = result.data;

  if (registerSecret !== ENV.REGISTER_SECRET) {
    return { error: 'Virheellinen rekisteröintitunnus' };
  }

  client.setConfig({
    baseUrl: ENV.API_BASE_URL,
    headers: { 'x-api-key': ENV.X_API_KEY },
  });

  const { data, error } = await postApiAuthSignup({
    client,
    body: { email, password, name, nickname },
  });

  if (error || !data) {
    const message = error?.error?.message ?? 'Rekisteröinti epäonnistui';
    return { error: message };
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

export default function Signup({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Container size={420} py={40}>
      <Title ta="center">Rekisteröidy</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Rekisteröimiseen tarvitset seuran jäsenyyden ja liittymistunnuksen.
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
          <TextInput
            label="Nimi"
            placeholder="Etunimi Sukunimi"
            name="name"
            required
            mt="md"
            error={actionData?.fieldErrors?.name}
          />
          <TextInput
            label="Nickname"
            description="Tunnus/nickname, näkyy ilmoittautumisissa"
            placeholder="setämies72"
            name="nickname"
            required
            mt="md"
            error={actionData?.fieldErrors?.nickname}
          />
          <PasswordInput
            label="Rekisteröintitunnus"
            description="Saat tämän seuralta."
            placeholder="supersecret"
            name="registerSecret"
            required
            mt="md"
            error={actionData?.fieldErrors?.registerSecret}
          />

          <Button type="submit" fullWidth mt="xl" loading={isSubmitting}>
            Rekisteröidy
          </Button>

          <Text ta="right" mt="md" size="sm">
            <Anchor component={Link} to="/login">
              Kirjautumiseen
            </Anchor>
          </Text>
        </Form>
      </Paper>
    </Container>
  );
}
