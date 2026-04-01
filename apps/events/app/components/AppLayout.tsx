import {
  Anchor,
  AppShell,
  Avatar,
  Burger,
  Divider,
  Drawer,
  Group,
  Menu,
  ScrollArea,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconLogout, IconUser } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router';
import type { User } from '~/domain/user';
import classes from './AppLayout.module.css';

const authenticatedLinks = [
  { to: '/events', label: 'Tapahtumat' },
  { to: '/events/new', label: 'Luo uusi' },
];

const unauthenticatedLinks = [
  { to: '/login', label: 'Kirjaudu' },
  { to: '/signup', label: 'Rekisteröidy' },
];

interface AppLayoutProps {
  children: React.ReactNode;
  user: User | null;
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();

  const navLinks = user ? authenticatedLinks : unauthenticatedLinks;

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title
              order={3}
              c="pink.2"
              ff="Bangers, cursive"
              renderRoot={(props) => <Link to="/" {...props} />}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              DT65 Events
            </Title>
          </Group>

          <Group gap={0} visibleFrom="sm" className={classes.mainLinks}>
            {navLinks.map((link) => (
              <Anchor
                key={link.to}
                component={Link}
                to={link.to}
                className={classes.mainLink}
                data-active={location.pathname === link.to || undefined}
              >
                {link.label}
              </Anchor>
            ))}
            {user && (
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <UnstyledButton className={classes.mainLink}>
                    <Group gap={7}>
                      <Avatar alt={user.nickname} radius="xl" size={20} color="pink.3">
                        {user.nickname.charAt(0).toUpperCase()}
                      </Avatar>
                      <Text fw={700} size="xs" tt="uppercase" lh={1}>
                        {user.nickname}
                      </Text>
                      <IconChevronDown size={12} stroke={1.5} />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item component={Link} to="/profile" leftSection={<IconUser size={14} />}>
                    Profiili
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    component={Link}
                    to="/logout"
                    leftSection={<IconLogout size={14} />}
                    color="red"
                  >
                    Kirjaudu ulos
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <Drawer
        opened={opened}
        onClose={close}
        size="100%"
        padding="md"
        title="DT65 Events"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md">
          <Divider my="sm" />
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={classes.drawerLink} onClick={close}>
              {link.label}
            </Link>
          ))}
          {user && (
            <>
              <Divider my="sm" />
              <Link to="/logout" className={classes.drawerLink} onClick={close}>
                Kirjaudu ulos
              </Link>
            </>
          )}
        </ScrollArea>
      </Drawer>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
