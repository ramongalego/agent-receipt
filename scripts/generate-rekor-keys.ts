import { generateKeyPairSync } from "crypto";

const { privateKey, publicKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256",
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

console.log("REKOR_PRIVATE_KEY=" + Buffer.from(privateKey).toString("base64"));
console.log("REKOR_PUBLIC_KEY=" + Buffer.from(publicKey).toString("base64"));
