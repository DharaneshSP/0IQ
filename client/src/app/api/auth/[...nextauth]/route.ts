import NextAuth from "next-auth/next";
import prisma from "@/lib/prismadb";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "a@gmail.com" },
        password: { label: "Password", type: "text", placeholder: "..." },
        role: { label: "Role", type: "text" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing Field");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user?.password) {
          throw new Error("No User Found");
        }

        const passwordmatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordmatch) {
          throw new Error("Incorrect Password");
        }

        if (credentials.role != user.role) {
          throw new Error("Unauthorized access.");
        }

        const token = { ...user, role: user.role };
        return token;
      },
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
