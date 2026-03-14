import type { IngestClient } from "../types";
export declare function wrapAnthropic<T extends object>(client: T, ingest: IngestClient): T;
