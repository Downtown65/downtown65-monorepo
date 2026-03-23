import { Title } from '@mantine/core';
import { DatePicker } from '@mantine/dates';

interface StepDateProps {
  value: string;
  onChange: (value: string) => void;
}

export function StepDate({ value, onChange }: StepDateProps) {
  return (
    <>
      <Title order={3} mb="md">
        Valitse päivä
      </Title>
      <DatePicker
        value={value || null}
        onChange={(date) => {
          if (date) onChange(date as string);
        }}
        size="md"
      />
    </>
  );
}
