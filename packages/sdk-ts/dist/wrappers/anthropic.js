"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapAnthropic = wrapAnthropic;
const crypto_1 = require("crypto");
function hasOnMethod(value) {
    return (value !== null &&
        typeof value === "object" &&
        "on" in value &&
        typeof value.on === "function");
}
function tryParseStructuredOutput(result) {
    if (!result || typeof result !== "object")
        return { output: result };
    const msg = result;
    if (!Array.isArray(msg.content))
        return { output: result };
    let hasStructured = false;
    const parsedContent = msg.content.map((block) => {
        if (typeof block === "object" &&
            block !== null &&
            block.type === "text") {
            const text = block.text;
            if (typeof text === "string" && text.trim().startsWith("{")) {
                try {
                    const parsed = JSON.parse(text);
                    hasStructured = true;
                    return { ...block, text: parsed };
                }
                catch {
                    return block;
                }
            }
        }
        return block;
    });
    if (!hasStructured)
        return { output: result };
    return {
        output: { ...msg, content: parsedContent },
        metadata: { structured: true },
    };
}
function extractToolCalls(result) {
    if (!result || typeof result !== "object")
        return [];
    const msg = result;
    if (!Array.isArray(msg.content))
        return [];
    return msg.content.filter((block) => typeof block === "object" &&
        block !== null &&
        block.type === "tool_use");
}
function sendToolCallEvents(toolCalls, ingest, sessionId, sessionName, durationMs) {
    for (const tool of toolCalls) {
        ingest
            .send({
            sessionId,
            sessionName,
            event: {
                type: "tool_call",
                name: tool.name,
                input: tool.input,
                output: { toolUseId: tool.id },
                durationMs,
            },
        })
            .catch(() => { });
    }
}
function wrapAnthropic(client, ingest, options) {
    const sessionId = (0, crypto_1.randomUUID)();
    const sessionName = options?.sessionName;
    const handler = {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (prop === "messages") {
                return new Proxy(value, {
                    get(msgTarget, msgProp) {
                        const msgValue = Reflect.get(msgTarget, msgProp);
                        if (msgProp === "create" && typeof msgValue === "function") {
                            return async function wrappedCreate(...args) {
                                const start = Date.now();
                                const params = args[0];
                                try {
                                    const result = await msgValue.apply(msgTarget, args);
                                    const durationMs = Date.now() - start;
                                    if (params?.stream && hasOnMethod(result)) {
                                        result.on("finalMessage", (message) => {
                                            const finalDurationMs = Date.now() - start;
                                            const structured = tryParseStructuredOutput(message);
                                            ingest
                                                .send({
                                                sessionId,
                                                sessionName,
                                                event: {
                                                    type: "llm_call",
                                                    name: params?.model ?? "anthropic",
                                                    input: params,
                                                    output: structured.output,
                                                    durationMs: finalDurationMs,
                                                    metadata: structured.metadata,
                                                },
                                            })
                                                .catch(() => { });
                                            const toolCalls = extractToolCalls(message);
                                            sendToolCallEvents(toolCalls, ingest, sessionId, sessionName, finalDurationMs);
                                        });
                                        return result;
                                    }
                                    const structured = tryParseStructuredOutput(result);
                                    ingest
                                        .send({
                                        sessionId,
                                        sessionName,
                                        event: {
                                            type: "llm_call",
                                            name: params?.model ?? "anthropic",
                                            input: params,
                                            output: structured.output,
                                            durationMs,
                                            metadata: structured.metadata,
                                        },
                                    })
                                        .catch(() => { });
                                    const toolCalls = extractToolCalls(result);
                                    sendToolCallEvents(toolCalls, ingest, sessionId, sessionName, durationMs);
                                    return result;
                                }
                                catch (e) {
                                    const durationMs = Date.now() - start;
                                    ingest
                                        .send({
                                        sessionId,
                                        sessionName,
                                        event: {
                                            type: "error",
                                            name: params?.model ?? "anthropic",
                                            input: params,
                                            output: {
                                                error: e instanceof Error ? e.message : String(e),
                                            },
                                            durationMs,
                                        },
                                    })
                                        .catch(() => { });
                                    throw e;
                                }
                            };
                        }
                        if (msgProp === "stream" && typeof msgValue === "function") {
                            return function wrappedStream(...args) {
                                const start = Date.now();
                                const params = args[0];
                                const result = msgValue.apply(msgTarget, args);
                                if (hasOnMethod(result)) {
                                    result.on("finalMessage", (message) => {
                                        const durationMs = Date.now() - start;
                                        const structured = tryParseStructuredOutput(message);
                                        ingest
                                            .send({
                                            sessionId,
                                            sessionName,
                                            event: {
                                                type: "llm_call",
                                                name: params?.model ?? "anthropic",
                                                input: params,
                                                output: structured.output,
                                                durationMs,
                                                metadata: structured.metadata,
                                            },
                                        })
                                            .catch(() => { });
                                        const toolCalls = extractToolCalls(message);
                                        sendToolCallEvents(toolCalls, ingest, sessionId, sessionName, durationMs);
                                    });
                                }
                                return result;
                            };
                        }
                        if (typeof msgValue === "function") {
                            return msgValue.bind(msgTarget);
                        }
                        return msgValue;
                    },
                });
            }
            return value;
        },
    };
    return new Proxy(client, handler);
}
