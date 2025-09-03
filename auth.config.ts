import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // For now, allow login with hardcoded credentials
        // In production, you should hash passwords and compare them
        if (credentials.email === "admin@example.com" && credentials.password === "admin") {
          return {
            id: "admin",
            email: "admin@example.com",
            name: "Admin",
            role: "ADMIN",
          };
        }

        if (credentials.email === "alice@example.com" && credentials.password === "alice") {
          return {
            id: "alice",
            email: "alice@example.com",
            name: "Alice",
            role: "CUSTOMER",
          };
        }

        if (credentials.email === "bob@example.com" && credentials.password === "bob") {
          return {
            id: "bob",
            email: "bob@example.com",
            name: "Bob",
            role: "CUSTOMER",
          };
        }

        return null;
      }
    }),
    Google,
    GitHub,
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
} satisfies NextAuthConfig;
