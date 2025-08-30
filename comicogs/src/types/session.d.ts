export type UserRole = "user" | "seller" | "admin";

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: UserRole;
  createdAt: string;
}

export interface Session {
  user: User;
  expires: string;
}

// Extend NextAuth types if using NextAuth
declare module "next-auth" {
  interface Session {
    user: User;
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role: UserRole;
    createdAt: string;
  }
}
