import { createApiApp } from '@/create-app';
import { Auth0Service } from '@/services/authentication-service';

const app = createApiApp(new Auth0Service());

export default app;
