import NextAuth from "next-auth"
// import Google from "next-auth/providers/google"
// import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
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
        // Look up user in DB
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email!, name: user.name ?? undefined, role: user.role as any };
      }
    }),
    // Google and GitHub providers temporarily disabled until OAuth credentials are configured
    // Google,
    // GitHub,
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
        // Ensure user id is available in session for server routes
        // next-auth stores the user id in token.sub
        (session.user as any).id = (token as any).sub as string | undefined;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
  }
})
