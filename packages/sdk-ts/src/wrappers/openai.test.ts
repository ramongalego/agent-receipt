import type { IngestClient } from "../types";
import { wrapOpenAI } from "./openai";

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
  const mockCreate = jest.fn().mockResolvedValue({
    id: "chatcmpl-123",
    choices: [{ message: { content: "Hello" } }],
  });
  return {
    client: {
      chat: { completions: { create: mockCreate } },
      otherProp: "untouched",
    },
    mockCreate,
  };
}

describe("wrapOpenAI", () => {
  it("calls the original method and returns its result unchanged", async () => {
    const ingest = createMockIngest();
    const { client, mockCreate } = createMockClient();
    const wrapped = wrapOpenAI(client, ingest);

    const result = await wrapped.chat.completions.create({
      model: "gpt-4o",
      messages: [],
    });

    expect(mockCreate).toHaveBeenCalledWith({ model: "gpt-4o", messages: [] });
    expect(result).toEqual({
      id: "chatcmpl-123",
      choices: [{ message: { content: "Hello" } }],
    });
  });

  it("sends an llm_call event to ingest on success", async () => {
    const ingest = createMockIngest();
    const { client } = createMockClient();
    const wrapped = wrapOpenAI(client, ingest);

    await wrapped.chat.completions.create({ model: "gpt-4o", messages: [] });
    await tick();

    expect(ingest.send).toHaveBeenCalledTimes(1);
    const payload = (ingest.send as jest.Mock).mock.calls[0][0];
    expect(payload.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(payload.event.type).toBe("llm_call");
    expect(payload.event.output).toEqual({
      id: "chatcmpl-123",
      choices: [{ message: { content: "Hello" } }],
    });
    expect(typeof payload.event.durationMs).toBe("number");
  });

  it("includes the correct model name from params in the event", async () => {
    const ingest = createMockIngest();
    const { client } = createMockClient();
    const wrapped = wrapOpenAI(client, ingest);

    await wrapped.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [],
    });
    await tick();

    const payload = (ingest.send as jest.Mock).mock.calls[0][0];
    expect(payload.event.name).toBe("gpt-4o-mini");
  });

  it("on LLM error, sends an error event and rethrows the error", async () => {
    const ingest = createMockIngest();
    const mockCreate = jest
      .fn()
      .mockRejectedValue(new Error("Rate limit exceeded"));
    const client = {
      chat: { completions: { create: mockCreate } },
    };
    const wrapped = wrapOpenAI(client, ingest);

    await expect(
      wrapped.chat.completions.create({ model: "gpt-4o", messages: [] }),
    ).rejects.toThrow("Rate limit exceeded");
    await tick();

    expect(ingest.send).toHaveBeenCalledTimes(1);
    const payload = (ingest.send as jest.Mock).mock.calls[0][0];
    expect(payload.event.type).toBe("error");
    expect(payload.event.name).toBe("gpt-4o");
    expect(payload.event.output).toEqual({ error: "Rate limit exceeded" });
  });

  it("does not throw if ingest.send fails", async () => {
    const ingest = createMockIngest();
    (ingest.send as jest.Mock).mockRejectedValue(new Error("Network error"));
    const { client } = createMockClient();
    const wrapped = wrapOpenAI(client, ingest);

    const result = await wrapped.chat.completions.create({
      model: "gpt-4o",
      messages: [],
    });
    await tick();

    expect(result).toEqual({
      id: "chatcmpl-123",
      choices: [{ message: { content: "Hello" } }],
    });
  });

  it("passes through non-intercepted properties unchanged", () => {
    const ingest = createMockIngest();
    const { client } = createMockClient();
    const wrapped = wrapOpenAI(client, ingest);

    expect(wrapped.otherProp).toBe("untouched");
  });

  it("reconstructs streaming response into one event", async () => {
    const ingest = createMockIngest();
    const chunks = [
      { choices: [{ delta: { content: "Hel" } }] },
      { choices: [{ delta: { content: "lo" } }] },
      { choices: [{ delta: { content: "!" } }] },
    ];

    async function* fakeStream() {
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    const mockCreate = jest.fn().mockResolvedValue(fakeStream());
    const client = { chat: { completions: { create: mockCreate } } };
    const wrapped = wrapOpenAI(client, ingest);

    const stream = await wrapped.chat.completions.create({
      model: "gpt-4o",
      messages: [],
      stream: true,
    });

    // Consume the stream
    const collected: unknown[] = [];
    for await (const chunk of stream as AsyncIterable<unknown>) {
      collected.push(chunk);
    }

    await tick();

    // All original chunks are yielded to the caller
    expect(collected).toEqual(chunks);

    // One single event is sent after stream completes
    expect(ingest.send).toHaveBeenCalledTimes(1);
    const payload = (ingest.send as jest.Mock).mock.calls[0][0];
    expect(payload.event.type).toBe("llm_call");
    expect(payload.event.name).toBe("gpt-4o");
    expect(payload.event.output).toEqual({ chunks });
  });

  describe("tool use", () => {
    it("captures one llm_call and one tool_call for a single tool call", async () => {
      const ingest = createMockIngest();
      const response = {
        id: "chatcmpl-tc1",
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_01",
                  type: "function",
                  function: {
                    name: "get_weather",
                    arguments: '{"location":"San Francisco"}',
                  },
                },
              ],
            },
          },
        ],
      };
      const mockCreate = jest.fn().mockResolvedValue(response);
      const client = { chat: { completions: { create: mockCreate } } };
      const wrapped = wrapOpenAI(client, ingest);

      await wrapped.chat.completions.create({
        model: "gpt-4o",
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

    it("captures one llm_call and multiple tool_call events for multiple tool calls", async () => {
      const ingest = createMockIngest();
      const response = {
        id: "chatcmpl-tc2",
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_01",
                  type: "function",
                  function: {
                    name: "get_weather",
                    arguments: '{"location":"SF"}',
                  },
                },
                {
                  id: "call_02",
                  type: "function",
                  function: {
                    name: "get_time",
                    arguments: '{"timezone":"PST"}',
                  },
                },
              ],
            },
          },
        ],
      };
      const mockCreate = jest.fn().mockResolvedValue(response);
      const client = { chat: { completions: { create: mockCreate } } };
      const wrapped = wrapOpenAI(client, ingest);

      await wrapped.chat.completions.create({
        model: "gpt-4o",
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
      const wrapped = wrapOpenAI(client, ingest);

      await wrapped.chat.completions.create({
        model: "gpt-4o",
        messages: [],
      });
      await tick();

      expect(ingest.send).toHaveBeenCalledTimes(1);
      expect((ingest.send as jest.Mock).mock.calls[0][0].event.type).toBe(
        "llm_call",
      );
    });

    it("tool_call event name matches the function name and input matches arguments", async () => {
      const ingest = createMockIngest();
      const response = {
        id: "chatcmpl-tc3",
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_99",
                  type: "function",
                  function: {
                    name: "send_email",
                    arguments: '{"to":"test@example.com","subject":"Hi"}',
                  },
                },
              ],
            },
          },
        ],
      };
      const mockCreate = jest.fn().mockResolvedValue(response);
      const client = { chat: { completions: { create: mockCreate } } };
      const wrapped = wrapOpenAI(client, ingest);

      await wrapped.chat.completions.create({
        model: "gpt-4o",
        messages: [],
      });
      await tick();

      const toolPayload = (ingest.send as jest.Mock).mock.calls[1][0];
      expect(toolPayload.event.name).toBe("send_email");
      expect(toolPayload.event.input).toEqual({
        to: "test@example.com",
        subject: "Hi",
      });
    });

    it("still captures llm_call even if ingest fails", async () => {
      const ingest = createMockIngest();
      (ingest.send as jest.Mock).mockRejectedValue(new Error("Network error"));
      const response = {
        id: "chatcmpl-tc4",
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call_01",
                  type: "function",
                  function: { name: "get_weather", arguments: "{}" },
                },
              ],
            },
          },
        ],
      };
      const mockCreate = jest.fn().mockResolvedValue(response);
      const client = { chat: { completions: { create: mockCreate } } };
      const wrapped = wrapOpenAI(client, ingest);

      const result = await wrapped.chat.completions.create({
        model: "gpt-4o",
        messages: [],
      });
      await tick();

      expect(result).toEqual(response);
      expect(ingest.send).toHaveBeenCalledTimes(2);
      expect((ingest.send as jest.Mock).mock.calls[0][0].event.type).toBe(
        "llm_call",
      );
      expect((ingest.send as jest.Mock).mock.calls[1][0].event.type).toBe(
        "tool_call",
      );
    });
  });

  describe("sessionName option", () => {
    it("includes sessionName in ingest payloads when provided", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapOpenAI(client, ingest, {
        sessionName: "Chat with user",
      });

      await wrapped.chat.completions.create({
        model: "gpt-4o",
        messages: [],
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.sessionName).toBe("Chat with user");
    });

    it("does not include sessionName when no options are passed", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapOpenAI(client, ingest);

      await wrapped.chat.completions.create({
        model: "gpt-4o",
        messages: [],
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.sessionName).toBeUndefined();
    });
  });
});
