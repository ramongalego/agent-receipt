"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapOpenAI = wrapOpenAI;
const crypto_1 = require("crypto");
function isAsyncIterable(value) {
    return (value !== null &&
        typeof value === "object" &&
        Symbol.asyncIterator in value);
}
function wrapStream(stream, ingest, sessionId, params, start) {
    return {
        [Symbol.asyncIterator]() {
            const iterator = stream[Symbol.asyncIterator]();
            const chunks = [];
            return {
                async next() {
                    const result = await iterator.next();
                    if (!result.done) {
                        chunks.push(result.value);
                    }
                    if (result.done) {
                        const durationMs = Date.now() - start;
                        ingest
                            .send({
                            sessionId,
                            event: {
                                type: "llm_call",
                                name: params?.model ?? "openai",
                                input: params,
                                output: { chunks },
                                durationMs,
                            },
                        })
                            .catch(() => { });
                    }
                    return result;
                },
                async return(value) {
                    if (iterator.return) {
                        return iterator.return(value);
                    }
                    return { done: true, value };
                },
            };
        },
    };
}
function wrapOpenAI(client, ingest) {
    // Each wrapped client gets one session that groups all its calls
    const sessionId = (0, crypto_1.randomUUID)();
    const handler = {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            // Intercept chat.completions.create
            if (prop === "chat") {
                return new Proxy(value, {
                    get(chatTarget, chatProp, chatReceiver) {
                        const chatValue = Reflect.get(chatTarget, chatProp, chatReceiver);
                        if (chatProp === "completions") {
                            return new Proxy(chatValue, {
                                get(compTarget, compProp, compReceiver) {
                                    const compValue = Reflect.get(compTarget, compProp, compReceiver);
                                    if (compProp === "create" &&
                                        typeof compValue === "function") {
                                        return async function wrappedCreate(...args) {
                                            const start = Date.now();
                                            const params = args[0];
                                            try {
                                                const result = await compValue.apply(compTarget, args);
                                                const durationMs = Date.now() - start;
                                                // Handle streaming responses
                                                if (params?.stream && isAsyncIterable(result)) {
                                                    return wrapStream(result, ingest, sessionId, params, start);
                                                }
                                                ingest
                                                    .send({
                                                    sessionId,
                                                    event: {
                                                        type: "llm_call",
                                                        name: params?.model ?? "openai",
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
                                                        name: params?.model ?? "openai",
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
                                    return compValue;
                                },
                            });
                        }
                        return chatValue;
                    },
                });
            }
            return value;
        },
    };
    return new Proxy(client, handler);
}
