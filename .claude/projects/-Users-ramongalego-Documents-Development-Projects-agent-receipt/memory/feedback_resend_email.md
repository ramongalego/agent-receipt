---
name: resend-email-config
description: Resend free tier can only send to the account owner's email. Use the account email as both FROM and test TO.
type: feedback
---

On Resend free tier without a verified domain, you can only send emails to the account owner's email (nightreveries@gmail.com). The sandbox `from` address (onboarding@resend.dev) still requires the recipient to be the account owner. Don't suggest workarounds that change the from address or env vars without understanding the actual constraint.

**Why:** User got frustrated by multiple wrong suggestions about Resend config.
**How to apply:** When dealing with Resend email issues, check the actual error message carefully before suggesting changes. The free tier constraint is about the recipient, not the sender.
