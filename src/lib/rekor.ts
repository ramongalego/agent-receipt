if (typeof window !== "undefined") {
  throw new Error("rekor.ts must only be used server-side");
}

import { createSign, createHash } from "crypto";
import { putRekorProof } from "./r2";

export type RekorResult =
  | { success: true; uuid: string; logIndex: number; anchoredAt: Date }
  | { success: false; error: string };

export async function anchorSessionToRekor(
  sessionId: string,
  sessionHash: string,
): Promise<RekorResult> {
  const privateKeyB64 = process.env.REKOR_PRIVATE_KEY;
  const publicKeyB64 = process.env.REKOR_PUBLIC_KEY;

  if (!privateKeyB64 || !publicKeyB64) {
    console.warn("[rekor] Signing keys not configured.");
    return { success: false, error: "Rekor signing keys not configured." };
  }

  try {
    const privateKeyPem = Buffer.from(privateKeyB64, "base64").toString(
      "utf-8",
    );
    const publicKeyPem = Buffer.from(publicKeyB64, "base64").toString("utf-8");

    // The session hash is our "artifact". We sign it, then provide its
    // SHA-256 as hash.value. Rekor's hashedrekord verifies that the
    // signature matches data whose SHA-256 equals hash.value.
    const signer = createSign("SHA256");
    signer.update(sessionHash, "utf-8");
    const signature = signer.sign(privateKeyPem, "base64");

    // hash.value = SHA-256 of the signed artifact (the session hash string)
    const artifactHash = createHash("sha256")
      .update(sessionHash, "utf-8")
      .digest("hex");

    // Rekor expects the public key as a base64-encoded PEM string
    const publicKeyContent = Buffer.from(publicKeyPem).toString("base64");

    const payload = {
      kind: "hashedrekord",
      apiVersion: "0.0.1",
      spec: {
        data: {
          hash: {
            algorithm: "sha256",
            value: artifactHash,
          },
        },
        signature: {
          content: signature,
          publicKey: {
            content: publicKeyContent,
          },
        },
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let response: Response;
    try {
      response = await fetch("https://rekor.sigstore.dev/api/v1/log/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[rekor] API returned non-200:", response.status, body);
      return {
        success: false,
        error: `Rekor API ${response.status}: ${body}`,
      };
    }

    const data = await response.json();
    const uuid = Object.keys(data)[0];
    if (!uuid) {
      console.error("[rekor] No UUID in response:", data);
      return {
        success: false,
        error: "Rekor returned an unexpected response.",
      };
    }

    const entry = data[uuid];
    const logIndex = typeof entry.logIndex === "number" ? entry.logIndex : null;

    if (logIndex === null) {
      console.error("[rekor] No logIndex in response:", entry);
      return {
        success: false,
        error: "Rekor returned a response without a log index.",
      };
    }

    // Persist inclusion proof to R2
    const proofResult = await putRekorProof(sessionId, data);
    if (!proofResult.ok) {
      console.warn("[rekor] Failed to store inclusion proof in R2.");
    }

    return {
      success: true,
      uuid,
      logIndex,
      anchoredAt: new Date(),
    };
  } catch (error) {
    console.error("Rekor anchoring failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
