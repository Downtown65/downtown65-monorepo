import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('events', 'routes/events.tsx'),
  route('events/new', 'routes/events.new.tsx'),
  route('events/:id', 'routes/events.$id.tsx'),
  route('events/:id/edit', 'routes/events.$id.edit.tsx'),
  route('events/:id/participate', 'routes/events.$id.participate.ts'),
  route('profile', 'routes/profile.tsx'),
  route('login', 'routes/login.tsx'),
  route('logout', 'routes/logout.ts'),
  route('signup', 'routes/signup.tsx'),
  route('forgot-password', 'routes/forgot-password.tsx'),
] satisfies RouteConfig;
