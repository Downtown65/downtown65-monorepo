import { Badge, Card, Group, Stack, Text, Title, TypographyStylesProvider } from '@mantine/core';
import { IconCalendarEvent, IconMapPin, IconTrophy } from '@tabler/icons-react';
import { getEventTypeInfo } from '~/lib/event-type-map';
import type { WizardState } from './types';

interface StepPreviewProps {
  data: WizardState;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fi-FI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function StepPreview({ data }: StepPreviewProps) {
  return (
    <>
      <Title order={3} mb="md">
        Esikatselu
      </Title>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="xs">
          <Text fw={500} size="lg">
            {data.title || 'Ei otsikkoa'}
          </Text>
          {data.race && (
            <Badge color="yellow" variant="light" leftSection={<IconTrophy size={12} />}>
              Kilpailu
            </Badge>
          )}
        </Group>

        {data.subtitle && (
          <Text fw={500} mb="sm">
            {data.subtitle}
          </Text>
        )}

        {data.eventType && (
          <Badge variant="light" mb="sm">
            {getEventTypeInfo(data.eventType).label}
          </Badge>
        )}

        <Stack gap="xs" mb="md">
          {data.dateStart && (
            <Group gap="xs">
              <IconCalendarEvent size={16} />
              <Text>
                {formatDate(data.dateStart)}
                {data.timeStart ? ` klo ${data.timeStart}` : ''}
              </Text>
            </Group>
          )}

          {data.location && (
            <Group gap="xs">
              <IconMapPin size={16} />
              <Text>{data.location}</Text>
            </Group>
          )}
        </Stack>

        {data.description && data.description !== '<p></p>' && (
          <TypographyStylesProvider>
            <div dangerouslySetInnerHTML={{ __html: data.description }} />
          </TypographyStylesProvider>
        )}
      </Card>
    </>
  );
}
