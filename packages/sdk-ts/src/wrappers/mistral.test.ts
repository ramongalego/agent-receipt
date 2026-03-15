import type { IngestClient } from "../types";
import { wrapMistral } from "./mistral";

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
  const mockComplete = jest.fn().mockResolvedValue({
    choices: [{ message: { content: "Hello from Mistral" } }],
  });
  const mockStream = jest.fn();
  return {
    client: {
      chat: { complete: mockComplete, stream: mockStream },
      otherProp: "untouched",
    },
    mockComplete,
    mockStream,
  };
}

describe("wrapMistral", () => {
  describe("complete", () => {
    it("captures one llm_call event with correct input and output", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapMistral(client, ingest);

      const result = await wrapped.chat.complete({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: "Hello" }],
      });
      await tick();

      expect(result).toEqual({
        choices: [{ message: { content: "Hello from Mistral" } }],
      });
      expect(ingest.send).toHaveBeenCalledTimes(1);
      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.type).toBe("llm_call");
      expect(payload.event.name).toBe("mistral-large-latest");
      expect(payload.event.input).toEqual([{ role: "user", content: "Hello" }]);
      expect(payload.event.output).toBe("Hello from Mistral");
      expect(payload.event.metadata).toBeUndefined();
    });

    it("sets structured: true and parses output with json_object responseFormat", async () => {
      const ingest = createMockIngest();
      const response = {
        choices: [{ message: { content: '{"name":"Acme","score":42}' } }],
      };
      const mockComplete = jest.fn().mockResolvedValue(response);
      const client = { chat: { complete: mockComplete } };
      const wrapped = wrapMistral(client, ingest);

      await wrapped.chat.complete({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: "JSON please" }],
        responseFormat: { type: "json_object" },
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.output).toEqual({ name: "Acme", score: 42 });
      expect(payload.event.metadata).toEqual({ structured: true });
    });

    it("captures tool_call events when response has toolCalls", async () => {
      const ingest = createMockIngest();
      const response = {
        choices: [
          {
            message: {
              content: "",
              toolCalls: [
                {
                  function: {
                    name: "get_weather",
                    arguments: '{"location":"SF"}',
                  },
                },
                {
                  function: {
                    name: "get_time",
                    arguments: '{"tz":"PST"}',
                  },
                },
              ],
            },
          },
        ],
      };
      const mockComplete = jest.fn().mockResolvedValue(response);
      const client = { chat: { complete: mockComplete } };
      const wrapped = wrapMistral(client, ingest);

      await wrapped.chat.complete({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: "Weather and time" }],
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
      expect((ingest.send as jest.Mock).mock.calls[1][0].event.input).toEqual({
        location: "SF",
      });
      expect((ingest.send as jest.Mock).mock.calls[2][0].event.type).toBe(
        "tool_call",
      );
      expect((ingest.send as jest.Mock).mock.calls[2][0].event.name).toBe(
        "get_time",
      );
    });

    it("returns original result unchanged even if ingest fails", async () => {
      const ingest = createMockIngest();
      (ingest.send as jest.Mock).mockRejectedValue(new Error("fail"));
      const { client } = createMockClient();
      const wrapped = wrapMistral(client, ingest);

      const result = await wrapped.chat.complete({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: "Hi" }],
      });

      expect(result).toEqual({
        choices: [{ message: { content: "Hello from Mistral" } }],
      });
    });

    it("extracts model name from params", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapMistral(client, ingest);

      await wrapped.chat.complete({
        model: "codestral-latest",
        messages: [],
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.name).toBe("codestral-latest");
    });
  });

  describe("stream", () => {
    it("captures one event after all chunks consumed", async () => {
      const ingest = createMockIngest();
      const events = [
        { data: { choices: [{ delta: { content: "Hello " } }] } },
        { data: { choices: [{ delta: { content: "world" } }] } },
        { data: { choices: [{ delta: { content: "!" } }] } },
      ];

      async function* fakeStream() {
        for (const event of events) {
          yield event;
        }
      }

      const mockStream = jest.fn().mockResolvedValue(fakeStream());
      const client = { chat: { complete: jest.fn(), stream: mockStream } };
      const wrapped = wrapMistral(client, ingest);

      const stream = await wrapped.chat.stream({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: "Hi" }],
      });

      const collected: unknown[] = [];
      for await (const event of stream as AsyncIterable<unknown>) {
        collected.push(event);
      }
      await tick();

      expect(collected).toEqual(events);
      expect(ingest.send).toHaveBeenCalledTimes(1);
      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.type).toBe("llm_call");
      expect(payload.event.name).toBe("mistral-large-latest");
      expect(payload.event.output).toBe("Hello world!");
      expect(payload.event.input).toEqual([{ role: "user", content: "Hi" }]);
    });

    it("yields all original events unchanged", async () => {
      const ingest = createMockIngest();
      const events = [
        { data: { choices: [{ delta: { content: "A" } }] }, extra: 1 },
        { data: { choices: [{ delta: { content: "B" } }] }, extra: 2 },
      ];

      async function* fakeStream() {
        for (const event of events) {
          yield event;
        }
      }

      const mockStream = jest.fn().mockResolvedValue(fakeStream());
      const client = { chat: { complete: jest.fn(), stream: mockStream } };
      const wrapped = wrapMistral(client, ingest);

      const stream = await wrapped.chat.stream({
        model: "mistral-large-latest",
        messages: [],
      });

      const collected: unknown[] = [];
      for await (const event of stream as AsyncIterable<unknown>) {
        collected.push(event);
      }

      expect(collected).toEqual(events);
    });

    it("returns original result unchanged even if ingest fails", async () => {
      const ingest = createMockIngest();
      (ingest.send as jest.Mock).mockRejectedValue(new Error("fail"));
      const events = [{ data: { choices: [{ delta: { content: "Hi" } }] } }];

      async function* fakeStream() {
        for (const event of events) {
          yield event;
        }
      }

      const mockStream = jest.fn().mockResolvedValue(fakeStream());
      const client = { chat: { complete: jest.fn(), stream: mockStream } };
      const wrapped = wrapMistral(client, ingest);

      const stream = await wrapped.chat.stream({
        model: "mistral-large-latest",
        messages: [],
      });

      const collected: unknown[] = [];
      for await (const event of stream as AsyncIterable<unknown>) {
        collected.push(event);
      }

      expect(collected).toEqual(events);
    });
  });

  describe("sessionName", () => {
    it("includes sessionName in ingest payloads", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapMistral(client, ingest, {
        sessionName: "Mistral task",
      });

      await wrapped.chat.complete({
        model: "mistral-large-latest",
        messages: [],
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.sessionName).toBe("Mistral task");
    });
  });

  it("passes through non-intercepted properties unchanged", () => {
    const ingest = createMockIngest();
    const { client } = createMockClient();
    const wrapped = wrapMistral(client, ingest);

    expect(wrapped.otherProp).toBe("untouched");
  });
});
