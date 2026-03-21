import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(
  email: string,
  teamName: string,
  token: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "AgentReceipt <noreply@agentreceipt.dev>",
    to: email,
    subject: `You've been invited to ${teamName} on AgentReceipt`,
    text: `You've been invited to join the "${teamName}" workspace on AgentReceipt.

Accept your invite here: ${inviteUrl}

This link expires in 7 days.

If you did not expect this invite, you can ignore this email.`,
  });
}
