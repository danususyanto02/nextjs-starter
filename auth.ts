import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/tokens";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [Credentials({
    name: "Credentials",
    credentials: { username: { label: "Username", type: "text" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      const username = typeof credentials?.username === "string" ? credentials.username : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user || user.status !== "ACTIVE" || !(await verifyPassword(password, user.passwordHash))) return null;
      return { id: user.id, name: user.displayName ?? user.username, username: user.username };
    }
  })],
  callbacks: {
    jwt({ token, user }) { if (user) { token.sub = user.id; token.username = (user as { username?: string }).username; } return token; },
    session({ session, token }) { if (session.user && token.sub) { session.user.id = token.sub; session.user.username = token.username as string | undefined; } return session; }
  },
  pages: { signIn: "/login" }
});
