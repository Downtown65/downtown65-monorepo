import { postApiAuthForgotPassword } from '@dt65/api-client';
import { Alert, Anchor, Button, Container, Paper, Text, TextInput, Title } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { Form, Link, useNavigation } from 'react-router';
import { z } from 'zod/v4';
import { createApiClient } from '~/lib/api.server';
import type { Route } from './+types/forgot-password';

const ForgotPasswordFormSchema = z.object({
  email: z.email('Sähköposti vaaditaan'),
});

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const result = ForgotPasswordFormSchema.safeParse({
    email: String(formData.get('email') ?? ''),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Sähköposti vaaditaan' };
  }

  const { email } = result.data;

  const apiClient = createApiClient();

  try {
    await postApiAuthForgotPassword({ client: apiClient, body: { email } });
  } catch {
    // Don't reveal whether the email exists
  }

  return { success: true };
}

export default function ForgotPassword({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Container size={420} py={40}>
      <Title ta="center">Unohditko salasanan?</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Syötä sähköpostiosoitteesi ja lähetämme sinulle salasanan palautuslinkin.
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        {actionData?.success && (
          <Alert icon={<IconCheck size={16} />} color="green" mb="md">
            Jos sähköpostiosoite on rekisteröity, saat salasanan palautuslinkin sähköpostiisi.
          </Alert>
        )}

        {actionData?.error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
            {actionData.error}
          </Alert>
        )}

        {!actionData?.success && (
          <Form method="post">
            <TextInput
              label="Sähköposti"
              placeholder="me@downtown65.com"
              name="email"
              type="email"
              required
            />

            <Button type="submit" fullWidth mt="xl" loading={isSubmitting}>
              Lähetä palautuslinkki
            </Button>
          </Form>
        )}

        <Text ta="right" mt="md" size="sm">
          <Anchor component={Link} to="/login">
            Kirjautumiseen
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
