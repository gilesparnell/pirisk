import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes — marketing pages and auth endpoints
      const publicPaths = ["/", "/login", "/api/auth"];
      const isPublic = publicPaths.some(
        (p) => pathname === p || pathname.startsWith("/api/auth")
      );

      if (isPublic) return true;

      // Hash-based anchors on marketing page (services, about, contact)
      if (pathname.startsWith("/#")) return true;

      // Protected routes under /app/* require auth
      if (pathname.startsWith("/app")) {
        return isLoggedIn;
      }

      // Everything else is public
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
