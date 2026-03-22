import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { feedbackSchema } from "@/lib/validations/feedback";
import { checkRateLimit, feedbackRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Not authenticated.", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const rl = await checkRateLimit(feedbackRateLimit, session.user.id);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later.", code: "RATE_LIMITED" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON.", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json(
      { error: firstError, code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(feedback)
    .values({
      userId: session.user.id,
      type: parsed.data.type,
      message: parsed.data.message,
    })
    .returning({ id: feedback.id });

  return NextResponse.json({ data: { id: row.id } }, { status: 201 });
}
