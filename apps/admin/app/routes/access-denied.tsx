import { Button, Container, Text, Title } from '@mantine/core';
import { IconShieldOff } from '@tabler/icons-react';
import { Link } from 'react-router';

export default function AccessDenied() {
  return (
    <Container size="sm" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <IconShieldOff size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
      <Title order={2} mb="md">
        Pääsy estetty
      </Title>
      <Text c="dimmed" mb="xl">
        Sinulla ei ole oikeuksia käyttää hallintapaneelia. Vain ylläpitäjät ja hallituksen jäsenet
        voivat kirjautua sisään.
      </Text>
      <Button component={Link} to="/login" variant="light">
        Kirjaudu toisella tilillä
      </Button>
    </Container>
  );
}
