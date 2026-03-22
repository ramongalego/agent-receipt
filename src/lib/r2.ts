import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { ok, err, type Result } from "./result";

const R2_REQUIRED_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

export function checkR2Config():
  | { ok: true }
  | { ok: false; missing: string[] } {
  const missing = R2_REQUIRED_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true };
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function putPayload(
  eventId: string,
  data: unknown,
): Promise<Result<void>> {
  try {
    const client = getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: `events/${eventId}/payload.json`,
        Body: JSON.stringify(data),
        ContentType: "application/json",
      }),
    );
    return ok(undefined);
  } catch (e) {
    console.error("[r2] Upload failed:", e);
    return err("Storage operation failed.", "R2_UPLOAD_ERROR");
  }
}

export async function getPayload(eventId: string): Promise<Result<unknown>> {
  try {
    const client = getR2Client();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: `events/${eventId}/payload.json`,
      }),
    );
    const body = await response.Body?.transformToString();
    if (!body) {
      return err("Empty response from R2.", "R2_EMPTY_RESPONSE");
    }
    return ok(JSON.parse(body));
  } catch (e) {
    console.error("[r2] Download failed:", e);
    return err("Storage operation failed.", "R2_DOWNLOAD_ERROR");
  }
}
