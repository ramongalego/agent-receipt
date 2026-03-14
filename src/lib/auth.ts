import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions as authSessions,
  verificationTokens,
} from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: authSessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GitHub,
    Google,
    Resend({
      from: "AgentReceipt <noreply@agentreceipt.dev>",
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
