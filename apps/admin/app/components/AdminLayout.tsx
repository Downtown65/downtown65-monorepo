import {
  AppShell,
  Badge,
  Burger,
  Group,
  Menu,
  NavLink,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendarEvent,
  IconLogout,
  IconShield,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router';
import { ThemeToggle } from './ThemeToggle';

interface AdminLayoutProps {
  children: React.ReactNode;
  user?: { nickname: string; role: string } | null;
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();

  const navLinks = [
    { to: '/users', label: 'Jäsenet', icon: IconUsers },
    { to: '/events', label: 'Tapahtumat', icon: IconCalendarEvent },
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
            <Group gap="xs">
              <IconShield size={24} />
              <Title
                order={3}
                renderRoot={(props) => <Link to="/" {...props} />}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                DT65 Admin
              </Title>
            </Group>
          </Group>
          <Group gap="xs" visibleFrom="sm">
            {/* biome-ignore lint/performance/useSolidForComponent: this is React, not Solid */}
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
                    <Group gap={4}>
                      <IconUser size={20} />
                      <Badge size="xs" variant="light">
                        {user.role}
                      </Badge>
                    </Group>
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
        {/* biome-ignore lint/performance/useSolidForComponent: this is React, not Solid */}
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
