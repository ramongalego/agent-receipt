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
  teams,
  teamMembers,
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
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    }),
  ],
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;

      const [team] = await db
        .insert(teams)
        .values({ name: "Main Workspace", ownerId: user.id })
        .returning();

      await db.insert(teamMembers).values({
        teamId: team.id,
        userId: user.id,
        role: "owner",
        invitedBy: user.id,
      });
    },
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
