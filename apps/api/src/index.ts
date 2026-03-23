import { createApiApp } from '@/create-app';
import { Auth0ManagementService } from '@/services/auth0-management-service';
import { Auth0Service } from '@/services/authentication-service';

const app = createApiApp(new Auth0Service(), new Auth0ManagementService());

export default app;
