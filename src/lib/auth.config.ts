import type { NextAuthConfig } from "next-auth";

// Config ligera para middleware (Edge Runtime) — sin Prisma ni bcrypt
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // los providers reales van en auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "PET_OWNER" | "VETERINARIAN";
      return session;
    },
  },
};
