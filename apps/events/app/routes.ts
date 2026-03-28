import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('events', 'routes/events.tsx'),
  route('events/new', 'routes/events.new.tsx'),
  route('events/:id', 'routes/events.$id.tsx'),
  route('events/:id/edit', 'routes/events.$id.edit.tsx'),
  route('login', 'routes/login.ts'),
  route('logout', 'routes/logout.ts'),
  route('signup', 'routes/signup.tsx'),
  route('forgot-password', 'routes/forgot-password.tsx'),
  route('auth/callback', 'routes/auth.callback.ts'),
] satisfies RouteConfig;
