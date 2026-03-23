import { Button, Group, SimpleGrid, Text, Title } from '@mantine/core';
import { useState } from 'react';

interface StepTimeProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function StepTime({ value, onChange }: StepTimeProps) {
  const [selectedHour, setSelectedHour] = useState<string | null>(value ? value.slice(0, 2) : null);
  const [selectedMinute, setSelectedMinute] = useState<string | null>(
    value ? value.slice(3, 5) : null,
  );

  function handleHourSelect(hour: string) {
    setSelectedHour(hour);
    const min = selectedMinute ?? '00';
    onChange(`${hour}:${min}`);
  }

  function handleMinuteSelect(minute: string) {
    setSelectedMinute(minute);
    const hr = selectedHour ?? '12';
    onChange(`${hr}:${minute}`);
  }

  function handleClear() {
    setSelectedHour(null);
    setSelectedMinute(null);
    onChange(null);
  }

  return (
    <>
      <Title order={3} mb="md">
        Valitse aika
      </Title>

      <Text fw={500} mb="xs">
        Tunti
      </Text>
      <SimpleGrid cols={{ base: 4, sm: 6 }} spacing="xs" mb="md">
        {hours.map((h) => (
          <Button
            key={h}
            variant={selectedHour === h ? 'filled' : 'light'}
            onClick={() => handleHourSelect(h)}
            size="sm"
          >
            {h}
          </Button>
        ))}
      </SimpleGrid>

      <Text fw={500} mb="xs">
        Minuutti
      </Text>
      <SimpleGrid cols={{ base: 4, sm: 6 }} spacing="xs" mb="md">
        {minutes.map((m) => (
          <Button
            key={m}
            variant={selectedMinute === m ? 'filled' : 'light'}
            onClick={() => handleMinuteSelect(m)}
            size="sm"
          >
            {m}
          </Button>
        ))}
      </SimpleGrid>

      <Group>
        <Button variant="subtle" onClick={handleClear}>
          Tyhjennä aika
        </Button>
        {value && <Text c="dimmed">Valittu: klo {value}</Text>}
      </Group>
    </>
  );
}
