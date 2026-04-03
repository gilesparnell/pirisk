import "next-auth";

declare module "next-auth" {
  interface User {
    status?: string;
    role?: string;
  }

  interface Session {
    user: User & {
      id: string;
      status: string;
      role: string;
    };
  }
}
