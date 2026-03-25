import { createContext } from 'react-router';
import type { User } from '~/domain/user';

// Create a context for user data
export const userContext = createContext<User | null>(null);
