import { Checkbox, TextInput, Title } from '@mantine/core';

interface StepTitleProps {
  title: string;
  subtitle: string;
  location: string;
  race: boolean;
  onTitleChange: (value: string) => void;
  onSubtitleChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onRaceChange: (value: boolean) => void;
}

export function StepTitle({
  title,
  subtitle,
  location,
  race,
  onTitleChange,
  onSubtitleChange,
  onLocationChange,
  onRaceChange,
}: StepTitleProps) {
  return (
    <>
      <Title order={3} mb="md">
        Tapahtuman tiedot
      </Title>
      <TextInput
        label="Tapahtuman nimi"
        placeholder="Jukola Konala"
        value={title}
        onChange={(e) => onTitleChange(e.currentTarget.value)}
        required
        mb="md"
      />
      <TextInput
        label="Alaotsikko"
        placeholder="Valinnainen alaotsikko"
        value={subtitle}
        onChange={(e) => onSubtitleChange(e.currentTarget.value)}
        mb="md"
      />
      <TextInput
        label="Paikka"
        placeholder="Sijainti"
        value={location}
        onChange={(e) => onLocationChange(e.currentTarget.value)}
        mb="md"
      />
      <Checkbox
        label="Kilpailu"
        checked={race}
        onChange={(e) => onRaceChange(e.currentTarget.checked)}
      />
    </>
  );
}
