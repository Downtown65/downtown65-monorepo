import { AppShell, Burger, Group, Menu, NavLink, Title, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendarEvent,
  IconLogin,
  IconLogout,
  IconPlus,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router';
import { ThemeToggle } from './ThemeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
  user?: { nickname: string; email?: string | undefined } | null;
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();

  const authenticatedLinks = [
    { to: '/events', label: 'Tapahtumat', icon: IconCalendarEvent },
    { to: '/events/new', label: 'Luo uusi', icon: IconPlus },
  ];

  const unauthenticatedLinks = [
    { to: '/login', label: 'Kirjaudu', icon: IconLogin },
    { to: '/signup', label: 'Rekisteröidy', icon: IconUserPlus },
  ];

  const navLinks = user ? authenticatedLinks : unauthenticatedLinks;

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
            {user && (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <UnstyledButton>
                    <IconUser size={20} />
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{user.nickname}</Menu.Label>
                  <Menu.Item component={Link} to="/logout" leftSection={<IconLogout size={14} />}>
                    Kirjaudu ulos
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
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
        {user && (
          <NavLink
            component={Link}
            to="/logout"
            label="Kirjaudu ulos"
            leftSection={<IconLogout size={16} />}
            onClick={close}
          />
        )}
        <Group mt="md" px="sm">
          <ThemeToggle />
        </Group>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
