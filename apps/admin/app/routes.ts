import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('users', 'routes/users.tsx'),
  route('events', 'routes/events.tsx'),
  route('login', 'routes/login.ts'),
  route('logout', 'routes/logout.ts'),
  route('auth/callback', 'routes/auth.callback.ts'),
  route('access-denied', 'routes/access-denied.tsx'),
] satisfies RouteConfig;
