import type { IngestClient, WrapperOptions } from "../types";
export declare function wrapOpenAI<T extends object>(client: T, ingest: IngestClient, options?: WrapperOptions): T;
