"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapOpenAI = wrapOpenAI;
const crypto_1 = require("crypto");
function isAsyncIterable(value) {
    return (value !== null &&
        typeof value === "object" &&
        Symbol.asyncIterator in value);
}
function tryParseStructuredOutput(params, result) {
    if (!result || typeof result !== "object")
        return { output: result };
    const fmt = params?.response_format;
    if (fmt?.type !== "json_object" && fmt?.type !== "json_schema") {
        return { output: result };
    }
    const res = result;
    const content = res.choices?.[0]?.message?.content;
    if (typeof content !== "string")
        return { output: result };
    try {
        const parsed = JSON.parse(content);
        const patched = {
            ...res,
            choices: res.choices.map((c, i) => i === 0 ? { ...c, message: { ...c.message, content: parsed } } : c),
        };
        return { output: patched, metadata: { structured: true } };
    }
    catch {
        return { output: result };
    }
}
function extractToolCalls(result) {
    if (!result || typeof result !== "object")
        return [];
    const res = result;
    const toolCalls = res.choices?.[0]?.message?.tool_calls;
    if (!Array.isArray(toolCalls))
        return [];
    return toolCalls.filter((tc) => typeof tc === "object" &&
        tc !== null &&
        tc.type === "function");
}
function sendToolCallEvents(toolCalls, ingest, sessionId, sessionName, durationMs) {
    for (const tc of toolCalls) {
        let parsedArgs;
        try {
            parsedArgs = JSON.parse(tc.function.arguments);
        }
        catch {
            parsedArgs = tc.function.arguments;
        }
        ingest
            .send({
            sessionId,
            sessionName,
            event: {
                type: "tool_call",
                name: tc.function.name,
                input: parsedArgs,
                output: { toolCallId: tc.id },
                durationMs,
            },
        })
            .catch(() => { });
    }
}
function wrapStream(stream, ingest, sessionId, sessionName, params, start) {
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
                            sessionName,
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
function wrapOpenAI(client, ingest, options) {
    const sessionId = (0, crypto_1.randomUUID)();
    const sessionName = options?.sessionName;
    const handler = {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
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
                                                if (params?.stream && isAsyncIterable(result)) {
                                                    return wrapStream(result, ingest, sessionId, sessionName, params, start);
                                                }
                                                const structured = tryParseStructuredOutput(params, result);
                                                ingest
                                                    .send({
                                                    sessionId,
                                                    sessionName,
                                                    event: {
                                                        type: "llm_call",
                                                        name: params?.model ?? "openai",
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
