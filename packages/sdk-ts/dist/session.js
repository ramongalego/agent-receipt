"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
const crypto_1 = require("crypto");
function createSession(ingest, name) {
    const id = (0, crypto_1.randomUUID)();
    async function trackTool(toolName, input, fn) {
        const start = Date.now();
        let output;
        let error;
        try {
            const result = await fn();
            output = result;
            return result;
        }
        catch (e) {
            error = e;
            throw e;
        }
        finally {
            const durationMs = Date.now() - start;
            const event = {
                type: error ? "error" : "tool_call",
                name: toolName,
                input,
                output: error
                    ? { error: error instanceof Error ? error.message : String(error) }
                    : output,
                durationMs,
            };
            // Fire and forget. Never block the caller.
            ingest
                .send({
                sessionId: id,
                sessionName: name,
                event,
            })
                .catch(() => {
                // Silently ignore ingest errors
            });
        }
    }
    async function trackDecision(decisionName, reasoning, outcome) {
        await ingest
            .send({
            sessionId: id,
            sessionName: name,
            event: {
                type: "decision",
                name: decisionName,
                input: { reasoning },
                output: { outcome },
                durationMs: 0,
            },
        })
            .catch(() => {
            // Silently ignore ingest errors
        });
    }
    async function end() {
        await ingest.flush();
    }
    return {
        get id() {
            return id;
        },
        get name() {
            return name;
        },
        trackTool,
        trackDecision,
        end,
    };
}
