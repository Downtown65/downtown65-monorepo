import { Title } from '@mantine/core';
import { DatePicker } from '@mantine/dates';

interface StepDateProps {
  value: string;
  onChange: (value: string) => void;
}

export function StepDate({ value, onChange }: StepDateProps) {
  const dateValue = value ? new Date(value) : null;

  return (
    <>
      <Title order={3} mb="md">
        Valitse päivä
      </Title>
      <DatePicker
        value={dateValue}
        onChange={(date) => {
          if (date) {
            const d = date as unknown as Date;
            const iso = d.toISOString().split('T')[0];
            if (iso) onChange(iso);
          }
        }}
        minDate={new Date()}
        size="md"
      />
    </>
  );
}
