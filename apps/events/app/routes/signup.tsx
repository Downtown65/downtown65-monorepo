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
import { Form, Link, redirect, useActionData, useNavigation } from 'react-router';
import { ENV } from 'varlock/env';
import { createAuth0User, getLoginUrl } from '~/lib/auth.server';
import { createPkceCookie } from '~/lib/session.server';

interface ActionData {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  const nickname = formData.get('nickname') as string;
  const registerSecret = formData.get('registerSecret') as string;

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = 'Sähköposti vaaditaan';
  if (!password || password.length < 8)
    fieldErrors.password = 'Salasanan on oltava vähintään 8 merkkiä';
  if (!name) fieldErrors.name = 'Nimi vaaditaan';
  if (!nickname) fieldErrors.nickname = 'Nickname vaaditaan';
  if (!registerSecret) fieldErrors.registerSecret = 'Rekisteröintitunnus vaaditaan';

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors } satisfies ActionData;
  }

  if (registerSecret !== ENV.REGISTER_SECRET) {
    return { error: 'Virheellinen rekisteröintitunnus' } satisfies ActionData;
  }

  try {
    await createAuth0User({ email, password, name, nickname });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rekisteröinti epäonnistui';
    return { error: message } satisfies ActionData;
  }

  // After successful signup, redirect to Auth0 login
  const { url, codeVerifier, state } = await getLoginUrl(request);
  const pkceCookie = await createPkceCookie({ codeVerifier, state });

  return redirect(url, {
    headers: { 'Set-Cookie': pkceCookie },
  });
}

export default function Signup() {
  const actionData = useActionData<ActionData>();
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
