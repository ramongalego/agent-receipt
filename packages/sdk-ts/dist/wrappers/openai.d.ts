import type { IngestClient } from "../types";
export declare function wrapOpenAI<T extends object>(client: T, ingest: IngestClient): T;
