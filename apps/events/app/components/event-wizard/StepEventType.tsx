import { EVENT_TYPES, type EventType } from '@dt65/shared';
import { Button, SimpleGrid, Title } from '@mantine/core';
import { getEventTypeInfo } from '~/lib/event-type-map';

interface StepEventTypeProps {
  value: EventType | null;
  onChange: (type: EventType) => void;
}

const sortedTypes = [...EVENT_TYPES].sort((a, b) => {
  const aInfo = getEventTypeInfo(a);
  const bInfo = getEventTypeInfo(b);
  return aInfo.label.localeCompare(bInfo.label, 'fi');
});

export function StepEventType({ value, onChange }: StepEventTypeProps) {
  return (
    <>
      <Title order={3} mb="md">
        Valitse laji
      </Title>
      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
        {sortedTypes.map((type) => {
          const info = getEventTypeInfo(type);
          const TypeIcon = info.icon;
          return (
            <Button
              key={type}
              color={value === type ? 'pink.3' : 'blue'}
              onClick={() => onChange(type)}
              size="sm"
              leftSection={<TypeIcon size={16} />}
            >
              {info.label}
            </Button>
          );
        })}
      </SimpleGrid>
    </>
  );
}
