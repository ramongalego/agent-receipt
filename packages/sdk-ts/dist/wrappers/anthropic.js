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
function wrapAnthropic(client, ingest) {
    // Each wrapped client gets one session that groups all its calls
    const sessionId = (0, crypto_1.randomUUID)();
    const handler = {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            // Intercept messages.create and messages.stream
            if (prop === "messages") {
                return new Proxy(value, {
                    get(msgTarget, msgProp) {
                        const msgValue = Reflect.get(msgTarget, msgProp);
                        // Wrap messages.create
                        if (msgProp === "create" && typeof msgValue === "function") {
                            return async function wrappedCreate(...args) {
                                const start = Date.now();
                                const params = args[0];
                                try {
                                    const result = await msgValue.apply(msgTarget, args);
                                    const durationMs = Date.now() - start;
                                    // Handle streaming responses via create({ stream: true })
                                    if (params?.stream && hasOnMethod(result)) {
                                        const textChunks = [];
                                        result.on("text", (text) => {
                                            textChunks.push(String(text));
                                        });
                                        result.on("finalMessage", (message) => {
                                            const finalDurationMs = Date.now() - start;
                                            ingest
                                                .send({
                                                sessionId,
                                                event: {
                                                    type: "llm_call",
                                                    name: params?.model ?? "anthropic",
                                                    input: params,
                                                    output: message,
                                                    durationMs: finalDurationMs,
                                                },
                                            })
                                                .catch(() => { });
                                        });
                                        return result;
                                    }
                                    ingest
                                        .send({
                                        sessionId,
                                        event: {
                                            type: "llm_call",
                                            name: params?.model ?? "anthropic",
                                            input: params,
                                            output: result,
                                            durationMs,
                                        },
                                    })
                                        .catch(() => { });
                                    return result;
                                }
                                catch (e) {
                                    const durationMs = Date.now() - start;
                                    ingest
                                        .send({
                                        sessionId,
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
                        // Wrap messages.stream
                        if (msgProp === "stream" && typeof msgValue === "function") {
                            return function wrappedStream(...args) {
                                const start = Date.now();
                                const params = args[0];
                                const result = msgValue.apply(msgTarget, args);
                                if (hasOnMethod(result)) {
                                    result.on("finalMessage", (message) => {
                                        const durationMs = Date.now() - start;
                                        ingest
                                            .send({
                                            sessionId,
                                            event: {
                                                type: "llm_call",
                                                name: params?.model ?? "anthropic",
                                                input: params,
                                                output: message,
                                                durationMs,
                                            },
                                        })
                                            .catch(() => { });
                                    });
                                }
                                return result;
                            };
                        }
                        // Bind non-intercepted methods to the original target
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
