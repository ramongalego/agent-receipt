"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const ingest_1 = require("./ingest");
const session_1 = require("./session");
const openai_1 = require("./wrappers/openai");
const anthropic_1 = require("./wrappers/anthropic");
const DEFAULT_BASE_URL = "https://agentreceipt.com";
function createClient(options) {
    const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    const ingest = (0, ingest_1.createIngestClient)(options.apiKey, baseUrl);
    return {
        startSession(name) {
            return (0, session_1.createSession)(ingest, name);
        },
        async track(sessionId, event) {
            return ingest.send({ sessionId, event });
        },
        wrapOpenAI(client, opts) {
            return (0, openai_1.wrapOpenAI)(client, ingest, opts);
        },
        wrapAnthropic(client, opts) {
            return (0, anthropic_1.wrapAnthropic)(client, ingest, opts);
        },
    };
}
