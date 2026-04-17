"use server";

import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, teams, agentSessions, events } from "@/db/schema";
import { getUserPlan } from "./billing";
import { anchorSessionToRekor } from "./rekor";
import type { PlanName } from "./billing-plans";

export async function getTeamPlan(teamId: string): Promise<PlanName> {
  const team = await db
    .select({ ownerId: teams.ownerId })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!team) return "free";

  const owner = await db
    .select({
      stripePriceId: users.stripePriceId,
      stripeCurrentPeriodEnd: users.stripeCurrentPeriodEnd,
    })
    .from(users)
    .where(eq(users.id, team.ownerId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!owner) return "free";

  return getUserPlan(owner);
}

export async function anchorSessionIfEligible(
  sessionId: string,
  projectId: string,
  teamId: string,
): Promise<void> {
  try {
    // Wait for all events (including session.end) to be fully committed
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const plan = await getTeamPlan(teamId);
    if (plan === "free") return;

    const sessionEvents = await db
      .select({ hash: events.hash, name: events.name })
      .from(events)
      .where(eq(events.sessionId, sessionId))
      .orderBy(asc(events.timestamp), asc(events.id));

    // Filter out the session.end termination marker
    const realEvents = sessionEvents.filter((e) => e.name !== "session.end");

    if (realEvents.length === 0) {
      console.error(
        `[rekor] No real events found for session ${sessionId} after filtering session.end`,
      );
      await db
        .update(agentSessions)
        .set({ rekorStatus: "failed" })
        .where(eq(agentSessions.id, sessionId));
      return;
    }

    const finalHash = realEvents[realEvents.length - 1].hash;

    const result = await anchorSessionToRekor(sessionId, finalHash);

    if (result.success) {
      await db
        .update(agentSessions)
        .set({
          rekorUuid: result.uuid,
          rekorLogIndex: result.logIndex,
          rekorAnchoredAt: result.anchoredAt,
          rekorStatus: "anchored",
        })
        .where(eq(agentSessions.id, sessionId));

      revalidatePath(`/dashboard/projects/${projectId}/sessions/${sessionId}`);
    } else {
      console.error("Anchor failed for session", sessionId, result.error);
      await db
        .update(agentSessions)
        .set({ rekorStatus: "failed" })
        .where(eq(agentSessions.id, sessionId));
    }
  } catch (e) {
    console.error(
      `[rekor] Unexpected error anchoring session ${sessionId}:`,
      e,
    );
    try {
      await db
        .update(agentSessions)
        .set({ rekorStatus: "failed" })
        .where(eq(agentSessions.id, sessionId));
    } catch {
      // Swallow DB update error in cleanup
    }
  }
}
