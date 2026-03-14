import type { IngestClient } from "../types";
import { wrapAnthropic } from "./anthropic";

function createMockIngest(): IngestClient {
  return {
    send: jest.fn().mockResolvedValue({ ok: true, value: "ok" }),
    flush: jest.fn().mockResolvedValue({ ok: true, value: "ok" }),
    getQueueLength: jest.fn().mockReturnValue(0),
    destroy: jest.fn(),
  };
}

function tick() {
  return new Promise((r) => setTimeout(r, 10));
}

function createMockClient() {
  const mockCreate = jest
    .fn()
    .mockResolvedValue({ id: "msg_123", content: [{ text: "Hello" }] });
  return {
    client: {
      messages: { create: mockCreate },
      otherProp: "untouched",
    },
    mockCreate,
  };
}

type EventHandler = (...args: unknown[]) => void;

function createMockMessageStream(finalMessage: unknown) {
  const handlers: Record<string, EventHandler[]> = {};
  const stream = {
    on(event: string, cb: EventHandler) {
      if (!handlers[event]) handlers[event] = [];
      handlers[event].push(cb);
      return stream;
    },
    _emit(event: string, ...args: unknown[]) {
      for (const cb of handlers[event] ?? []) {
        cb(...args);
      }
    },
    _finalMessage: finalMessage,
  };
  return stream;
}

describe("wrapAnthropic", () => {
  it("calls the original method and returns its result unchanged", async () => {
    const ingest = createMockIngest();
    const { client, mockCreate } = createMockClient();
    const wrapped = wrapAnthropic(client, ingest);

    const result = await wrapped.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [],
    });

    expect(mockCreate).toHaveBeenCalledWith({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [],
    });
    expect(result).toEqual({ id: "msg_123", content: [{ text: "Hello" }] });
  });

  it("sends an llm_call event to ingest on success", async () => {
    const ingest = createMockIngest();
    const { client } = createMockClient();
    const wrapped = wrapAnthropic(client, ingest);

    await wrapped.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [],
    });
    await tick();

    expect(ingest.send).toHaveBeenCalledTimes(1);
    const payload = (ingest.send as jest.Mock).mock.calls[0][0];
    expect(payload.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(payload.event.type).toBe("llm_call");
    expect(payload.event.output).toEqual({
      id: "msg_123",
      content: [{ text: "Hello" }],
    });
    expect(typeof payload.event.durationMs).toBe("number");
  });

  it("includes the correct model name from params in the event", async () => {
    const ingest = createMockIngest();
    const { client } = createMockClient();
    const wrapped = wrapAnthropic(client, ingest);

    await wrapped.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 4096,
      messages: [],
    });
    await tick();

    const payload = (ingest.send as jest.Mock).mock.calls[0][0];
    expect(payload.event.name).toBe("claude-opus-4-20250514");
  });

  it("on LLM error, sends an error event and rethrows the error", async () => {
    const ingest = createMockIngest();
    const mockCreate = jest.fn().mockRejectedValue(new Error("Overloaded"));
    const client = {
      messages: { create: mockCreate },
    };
    const wrapped = wrapAnthropic(client, ingest);

    await expect(
      wrapped.messages.create({
        model: "claude-sonnet-4-20250514",
        messages: [],
      }),
    ).rejects.toThrow("Overloaded");
    await tick();

    expect(ingest.send).toHaveBeenCalledTimes(1);
    const payload = (ingest.send as jest.Mock).mock.calls[0][0];
    expect(payload.event.type).toBe("error");
    expect(payload.event.name).toBe("claude-sonnet-4-20250514");
    expect(payload.event.output).toEqual({ error: "Overloaded" });
  });

  it("does not throw if ingest.send fails", async () => {
    const ingest = createMockIngest();
    (ingest.send as jest.Mock).mockRejectedValue(new Error("Network error"));
    const { client } = createMockClient();
    const wrapped = wrapAnthropic(client, ingest);

    const result = await wrapped.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [],
    });
    await tick();

    expect(result).toEqual({ id: "msg_123", content: [{ text: "Hello" }] });
  });

  it("passes through non-intercepted properties unchanged", () => {
    const ingest = createMockIngest();
    const { client } = createMockClient();
    const wrapped = wrapAnthropic(client, ingest);

    expect(wrapped.otherProp).toBe("untouched");
  });

  it("taps into messages.stream() via on() and sends event on finalMessage", async () => {
    const ingest = createMockIngest();
    const finalMsg = { id: "msg_456", content: [{ text: "Hello world" }] };
    const mockStreamObj = createMockMessageStream(finalMsg);
    const mockStream = jest.fn().mockReturnValue(mockStreamObj);

    const client = {
      messages: {
        create: jest.fn(),
        stream: mockStream,
      },
    };
    const wrapped = wrapAnthropic(client, ingest);

    const result = wrapped.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [],
    });

    // The original stream object is returned (with on() still working)
    expect(typeof (result as typeof mockStreamObj).on).toBe("function");

    // Simulate the stream completing
    mockStreamObj._emit("finalMessage", finalMsg);
    await tick();

    expect(ingest.send).toHaveBeenCalledTimes(1);
    const payload = (ingest.send as jest.Mock).mock.calls[0][0];
    expect(payload.event.type).toBe("llm_call");
    expect(payload.event.name).toBe("claude-sonnet-4-20250514");
    expect(payload.event.output).toEqual(finalMsg);
  });

  it("taps into create({ stream: true }) via on() and sends event on finalMessage", async () => {
    const ingest = createMockIngest();
    const finalMsg = { id: "msg_789", content: [{ text: "Streamed" }] };
    const mockStreamObj = createMockMessageStream(finalMsg);
    const mockCreate = jest.fn().mockResolvedValue(mockStreamObj);

    const client = {
      messages: { create: mockCreate },
    };
    const wrapped = wrapAnthropic(client, ingest);

    await wrapped.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [],
      stream: true,
    });

    // Simulate the stream completing
    mockStreamObj._emit("finalMessage", finalMsg);
    await tick();

    expect(ingest.send).toHaveBeenCalledTimes(1);
    const payload = (ingest.send as jest.Mock).mock.calls[0][0];
    expect(payload.event.type).toBe("llm_call");
    expect(payload.event.output).toEqual(finalMsg);
  });

  describe("tool use", () => {
    it("captures one llm_call and one tool_call for a single tool use", async () => {
      const ingest = createMockIngest();
      const response = {
        id: "msg_tc1",
        content: [
          {
            type: "tool_use",
            id: "toolu_01",
            name: "get_weather",
            input: { location: "San Francisco" },
          },
        ],
      };
      const mockCreate = jest.fn().mockResolvedValue(response);
      const client = { messages: { create: mockCreate } };
      const wrapped = wrapAnthropic(client, ingest);

      await wrapped.messages.create({
        model: "claude-sonnet-4-20250514",
        messages: [],
      });
      await tick();

      expect(ingest.send).toHaveBeenCalledTimes(2);

      const llmPayload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(llmPayload.event.type).toBe("llm_call");
      expect(llmPayload.event.output).toEqual(response);

      const toolPayload = (ingest.send as jest.Mock).mock.calls[1][0];
      expect(toolPayload.event.type).toBe("tool_call");
      expect(toolPayload.event.name).toBe("get_weather");
      expect(toolPayload.event.input).toEqual({ location: "San Francisco" });
    });

    it("captures one llm_call and multiple tool_call events for multiple tool uses", async () => {
      const ingest = createMockIngest();
      const response = {
        id: "msg_tc2",
        content: [
          {
            type: "tool_use",
            id: "toolu_01",
            name: "get_weather",
            input: { location: "SF" },
          },
          {
            type: "tool_use",
            id: "toolu_02",
            name: "get_time",
            input: { timezone: "PST" },
          },
        ],
      };
      const mockCreate = jest.fn().mockResolvedValue(response);
      const client = { messages: { create: mockCreate } };
      const wrapped = wrapAnthropic(client, ingest);

      await wrapped.messages.create({
        model: "claude-sonnet-4-20250514",
        messages: [],
      });
      await tick();

      expect(ingest.send).toHaveBeenCalledTimes(3);

      expect((ingest.send as jest.Mock).mock.calls[0][0].event.type).toBe(
        "llm_call",
      );
      expect((ingest.send as jest.Mock).mock.calls[1][0].event.type).toBe(
        "tool_call",
      );
      expect((ingest.send as jest.Mock).mock.calls[1][0].event.name).toBe(
        "get_weather",
      );
      expect((ingest.send as jest.Mock).mock.calls[2][0].event.type).toBe(
        "tool_call",
      );
      expect((ingest.send as jest.Mock).mock.calls[2][0].event.name).toBe(
        "get_time",
      );
    });

    it("captures only llm_call when response has no tool calls", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapAnthropic(client, ingest);

      await wrapped.messages.create({
        model: "claude-sonnet-4-20250514",
        messages: [],
      });
      await tick();

      expect(ingest.send).toHaveBeenCalledTimes(1);
      expect((ingest.send as jest.Mock).mock.calls[0][0].event.type).toBe(
        "llm_call",
      );
    });

    it("tool_call event name matches the function name", async () => {
      const ingest = createMockIngest();
      const response = {
        id: "msg_tc3",
        content: [
          {
            type: "tool_use",
            id: "toolu_99",
            name: "send_email",
            input: { to: "test@example.com" },
          },
        ],
      };
      const mockCreate = jest.fn().mockResolvedValue(response);
      const client = { messages: { create: mockCreate } };
      const wrapped = wrapAnthropic(client, ingest);

      await wrapped.messages.create({
        model: "claude-sonnet-4-20250514",
        messages: [],
      });
      await tick();

      const toolPayload = (ingest.send as jest.Mock).mock.calls[1][0];
      expect(toolPayload.event.name).toBe("send_email");
      expect(toolPayload.event.input).toEqual({ to: "test@example.com" });
    });

    it("still captures llm_call even if ingest fails", async () => {
      const ingest = createMockIngest();
      (ingest.send as jest.Mock).mockRejectedValue(new Error("Network error"));
      const response = {
        id: "msg_tc4",
        content: [
          {
            type: "tool_use",
            id: "toolu_01",
            name: "get_weather",
            input: {},
          },
        ],
      };
      const mockCreate = jest.fn().mockResolvedValue(response);
      const client = { messages: { create: mockCreate } };
      const wrapped = wrapAnthropic(client, ingest);

      const result = await wrapped.messages.create({
        model: "claude-sonnet-4-20250514",
        messages: [],
      });
      await tick();

      // The result is returned even though ingest failed
      expect(result).toEqual(response);
      // Both sends were attempted
      expect(ingest.send).toHaveBeenCalledTimes(2);
      expect((ingest.send as jest.Mock).mock.calls[0][0].event.type).toBe(
        "llm_call",
      );
      expect((ingest.send as jest.Mock).mock.calls[1][0].event.type).toBe(
        "tool_call",
      );
    });

    it("captures tool calls from streamed finalMessage", async () => {
      const ingest = createMockIngest();
      const finalMsg = {
        id: "msg_stream_tc",
        content: [
          {
            type: "tool_use",
            id: "toolu_s1",
            name: "search_db",
            input: { query: "test" },
          },
        ],
      };
      const mockStreamObj = createMockMessageStream(finalMsg);
      const mockStream = jest.fn().mockReturnValue(mockStreamObj);

      const client = {
        messages: { create: jest.fn(), stream: mockStream },
      };
      const wrapped = wrapAnthropic(client, ingest);

      wrapped.messages.stream({
        model: "claude-sonnet-4-20250514",
        messages: [],
      });

      mockStreamObj._emit("finalMessage", finalMsg);
      await tick();

      expect(ingest.send).toHaveBeenCalledTimes(2);
      expect((ingest.send as jest.Mock).mock.calls[0][0].event.type).toBe(
        "llm_call",
      );
      expect((ingest.send as jest.Mock).mock.calls[1][0].event.type).toBe(
        "tool_call",
      );
      expect((ingest.send as jest.Mock).mock.calls[1][0].event.name).toBe(
        "search_db",
      );
    });
  });

  describe("sessionName option", () => {
    it("includes sessionName in ingest payloads when provided", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapAnthropic(client, ingest, {
        sessionName: "Draft decision",
      });

      await wrapped.messages.create({
        model: "claude-sonnet-4-20250514",
        messages: [],
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.sessionName).toBe("Draft decision");
    });

    it("does not include sessionName when no options are passed", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapAnthropic(client, ingest);

      await wrapped.messages.create({
        model: "claude-sonnet-4-20250514",
        messages: [],
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.sessionName).toBeUndefined();
    });
  });

  describe("structured output", () => {
    it("parses text content that is valid JSON and sets structured: true", async () => {
      const ingest = createMockIngest();
      const response = {
        id: "msg_json",
        content: [{ type: "text", text: '{"name":"Acme","amount":4500}' }],
      };
      const mockCreate = jest.fn().mockResolvedValue(response);
      const client = { messages: { create: mockCreate } };
      const wrapped = wrapAnthropic(client, ingest);

      await wrapped.messages.create({
        model: "claude-sonnet-4-20250514",
        messages: [],
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.type).toBe("llm_call");
      expect(payload.event.output.content[0].text).toEqual({
        name: "Acme",
        amount: 4500,
      });
      expect(payload.event.metadata).toEqual({ structured: true });
    });

    it("stores text content as normal string when it is not JSON", async () => {
      const ingest = createMockIngest();
      const response = {
        id: "msg_plain",
        content: [{ type: "text", text: "Hello, this is plain text." }],
      };
      const mockCreate = jest.fn().mockResolvedValue(response);
      const client = { messages: { create: mockCreate } };
      const wrapped = wrapAnthropic(client, ingest);

      await wrapped.messages.create({
        model: "claude-sonnet-4-20250514",
        messages: [],
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.output.content[0].text).toBe(
        "Hello, this is plain text.",
      );
      expect(payload.event.metadata).toBeUndefined();
    });
  });
});
