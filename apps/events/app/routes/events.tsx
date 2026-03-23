import { Container, Text, Title } from '@mantine/core';

export default function Events() {
  return (
    <Container size="lg">
      <Title order={2} mb="md">
        Tapahtumat
      </Title>
      <Text c="dimmed">Ei tulevia tapahtumia.</Text>
    </Container>
  );
}
