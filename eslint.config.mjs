import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // SDK compiled output
    "packages/sdk-ts/dist/**",
    // Test harness build output and dependencies
    "packages/test-harness/.next/**",
    "packages/test-harness/node_modules/**",
    // MCP server compiled output
    "packages/mcp-server/dist/**",
    "packages/mcp-server/node_modules/**",
    // OpenClaw skill (standalone, not a TS package)
    "packages/openclaw-skill/**",
  ]),
]);

export default eslintConfig;
