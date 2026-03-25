import { Button, Container, Flex, Group, Text, Title } from '@mantine/core';
import { Link, redirect } from 'react-router';
import { getSession } from '~/lib/session.server';
import type { Route } from './+types/home';

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  if (session != null) {
    return redirect('/events');
  }

  return {};
}

export default function Home() {
  return (
    <Container size="lg" h="60vh">
      <Flex justify="center" align="center" direction="column" h="100%">
        <Title ff="Bangers, cursive" c="dt-pink.2" size={52} lts={2}>
          Downtown 65 Events
        </Title>
        <Group>
          <Button component={Link} variant="filled" to="/login">
            Kirjaudu
          </Button>
          <Button component={Link} variant="filled" to="/signup">
            Rekisteröidy
          </Button>
          <Button component={Link} variant="filled" to="/forgot-password">
            Salasana unohtunut?{' '}
          </Button>
        </Group>
        <Text my="sm" ff="Bangers, cursive">
          Your events gateway
        </Text>
      </Flex>
    </Container>
  );
}
