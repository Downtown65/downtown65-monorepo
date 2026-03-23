import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCalendarEvent, IconPlus } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router';
import { ThemeToggle } from './ThemeToggle';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();

  const navLinks = [
    { to: '/events', label: 'Tapahtumat', icon: IconCalendarEvent },
    { to: '/events/new', label: 'Luo uusi', icon: IconPlus },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title
              order={3}
              renderRoot={(props) => <Link to="/" {...props} />}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              Downtown 65
            </Title>
          </Group>
          <Group gap="xs" visibleFrom="sm">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                component={Link}
                to={link.to}
                label={link.label}
                leftSection={<link.icon size={16} />}
                active={location.pathname === link.to}
                style={{ borderRadius: 'var(--mantine-radius-sm)', width: 'auto' }}
              />
            ))}
            <ThemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            component={Link}
            to={link.to}
            label={link.label}
            leftSection={<link.icon size={16} />}
            active={location.pathname === link.to}
            onClick={close}
          />
        ))}
        <Group mt="md" px="sm">
          <ThemeToggle />
        </Group>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
