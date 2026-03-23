import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import classes from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon onClick={toggleColorScheme} variant="default" size="lg" aria-label="Vaihda teema">
      <IconSun size={16} stroke={1.5} className={classes.light} />
      <IconMoon size={16} stroke={1.5} className={classes.dark} />
    </ActionIcon>
  );
}
