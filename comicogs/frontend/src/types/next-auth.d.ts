import NextAuth from 'next-auth';
import { UserRole } from './session';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
