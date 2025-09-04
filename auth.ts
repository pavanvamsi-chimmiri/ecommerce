import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) {
          return null;
        }

        // For now, allow login with hardcoded credentials
        // In production, you should hash passwords and compare them
        if (email === "admin@example.com" && password === "admin") {
          return {
            id: "admin",
            email: "admin@example.com",
            name: "Admin",
            role: "ADMIN",
          };
        }

        if (email === "alice@example.com" && password === "alice") {
          return {
            id: "alice",
            email: "alice@example.com",
            name: "Alice",
            role: "CUSTOMER",
          };
        }

        if (email === "bob@example.com" && password === "bob") {
          return {
            id: "bob",
            email: "bob@example.com",
            name: "Bob",
            role: "CUSTOMER",
          };
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User | null }) {
      if (user) {
        (token as JWT).role = (user as User & { role?: string }).role as
          | "ADMIN"
          | "CUSTOMER"
          | undefined;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.role = token.role as "ADMIN" | "CUSTOMER" | undefined;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
})
