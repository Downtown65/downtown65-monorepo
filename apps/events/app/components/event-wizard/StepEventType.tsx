import { EVENT_TYPES, type EventType } from '@dt65/shared';
import { Button, SimpleGrid, Title } from '@mantine/core';

interface StepEventTypeProps {
  value: EventType | null;
  onChange: (type: EventType) => void;
}

function formatEventType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

const sortedTypes = [...EVENT_TYPES].sort((a, b) => a.localeCompare(b));

export function StepEventType({ value, onChange }: StepEventTypeProps) {
  return (
    <>
      <Title order={3} mb="md">
        Valitse laji
      </Title>
      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
        {sortedTypes.map((type) => (
          <Button
            key={type}
            variant={value === type ? 'filled' : 'light'}
            onClick={() => onChange(type)}
            size="md"
          >
            {formatEventType(type)}
          </Button>
        ))}
      </SimpleGrid>
    </>
  );
}
