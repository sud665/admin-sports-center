import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isMockMode } from "@/lib/mock-data";

const mockAuthUsers = [
  {
    id: "admin-001",
    email: "admin@test.com",
    password: "1234",
    name: "관리자",
    role: "admin" as const,
    color: null,
  },
  {
    id: "inst-001",
    email: "instructor@test.com",
    password: "1234",
    name: "김태권",
    role: "instructor" as const,
    color: "#3B82F6",
  },
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        if (isMockMode()) {
          const user = mockAuthUsers.find(
            (u) =>
              u.email === credentials.email &&
              u.password === credentials.password
          );
          if (!user) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            color: user.color,
          };
        }

        // 실제 DB 로직 (dynamic import로 mock 모드에서 로드 방지)
        const { db } = await import("@/lib/db");
        const { users } = await import("@/lib/db/schema");
        const { eq } = await import("drizzle-orm");
        const bcrypt = await import("bcryptjs");

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          color: user.color,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.color = user.color;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "instructor";
        session.user.color = token.color as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
