import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('events', 'routes/events.tsx'),
  route('events/:id', 'routes/events.$id.tsx'),
  route('login', 'routes/login.ts'),
  route('logout', 'routes/logout.ts'),
  route('signup', 'routes/signup.tsx'),
  route('auth/callback', 'routes/auth.callback.ts'),
] satisfies RouteConfig;
