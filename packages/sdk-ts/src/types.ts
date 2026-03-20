export type EventType =
  | "llm_call"
  | "tool_call"
  | "decision"
  | "error"
  | "human_review";

export type ComplianceMetadata = {
  containsPII?: boolean;
  dataCategory?: string;
  retentionOverride?: number;
};

export type TrackEventInput = {
  type: EventType;
  name: string;
  input: unknown;
  output: unknown;
  durationMs: number;
  metadata?: Record<string, unknown>;
  compliance?: ComplianceMetadata;
};

export type IngestPayload = {
  sessionId: string;
  sessionName?: string;
  event: TrackEventInput;
};

export type IngestResponse = {
  data?: { eventId: string; sessionId: string };
  error?: string;
  code?: string;
};

export type ClientOptions = {
  apiKey: string;
  baseUrl?: string;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

export type IngestClient = {
  send: (payload: IngestPayload) => Promise<Result<string>>;
  flush: () => Promise<Result<string>>;
  getQueueLength: () => number;
  destroy: () => void;
};

export type HumanReviewParams = {
  reviewer: string;
  decision: "approved" | "rejected" | "modified";
  notes?: string;
};

export type TrackOptions = {
  compliance?: ComplianceMetadata;
};

export type Session = {
  readonly id: string;
  readonly name: string | undefined;
  trackTool: <T>(
    name: string,
    input: unknown,
    fn: () => Promise<T>,
    options?: TrackOptions,
  ) => Promise<T>;
  trackDecision: (
    name: string,
    reasoning: string,
    outcome: string,
    options?: TrackOptions,
  ) => Promise<void>;
  trackHumanReview: (params: HumanReviewParams & TrackOptions) => Promise<void>;
  end: () => Promise<void>;
};

export type WrapperOptions = {
  sessionName?: string;
};

export type VercelAIFunctions = {
  generateText: (...args: unknown[]) => Promise<unknown>;
  streamText: (...args: unknown[]) => Promise<unknown>;
  generateObject: (...args: unknown[]) => Promise<unknown>;
  streamObject: (...args: unknown[]) => Promise<unknown>;
};

export type Client = {
  startSession: (name?: string) => Session;
  track: (sessionId: string, event: TrackEventInput) => Promise<Result<string>>;
  wrapOpenAI: <T extends object>(client: T, options?: WrapperOptions) => T;
  wrapAnthropic: <T extends object>(client: T, options?: WrapperOptions) => T;
  wrapVercelAI: <T extends VercelAIFunctions>(
    fns: T,
    options?: WrapperOptions,
  ) => T;
  wrapGemini: <T extends object>(client: T, options?: WrapperOptions) => T;
  wrapMistral: <T extends object>(client: T, options?: WrapperOptions) => T;
};
