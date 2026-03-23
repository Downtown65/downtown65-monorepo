import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  return (
    <ActionIcon
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      variant="default"
      size="lg"
      aria-label="Vaihda teema"
    >
      {computedColorScheme === 'light' ? (
        <IconMoon size={16} stroke={1.5} />
      ) : (
        <IconSun size={16} stroke={1.5} />
      )}
    </ActionIcon>
  );
}
