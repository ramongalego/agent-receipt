import type { IngestClient, WrapperOptions } from "../types";
export declare function wrapAnthropic<T extends object>(client: T, ingest: IngestClient, options?: WrapperOptions): T;
