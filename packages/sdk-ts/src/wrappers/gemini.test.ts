import type { IngestClient } from "../types";
import { wrapGemini } from "./gemini";

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
  const mockGenerateContent = jest.fn().mockResolvedValue({
    text: "The sky is blue because of Rayleigh scattering.",
  });
  const mockGenerateContentStream = jest.fn();
  return {
    client: {
      models: {
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
      },
      otherProp: "untouched",
    },
    mockGenerateContent,
    mockGenerateContentStream,
  };
}

describe("wrapGemini", () => {
  describe("generateContent", () => {
    it("captures one llm_call event with correct input and output", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapGemini(client, ingest);

      const result = await wrapped.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Why is the sky blue?",
      });
      await tick();

      expect(result).toEqual({
        text: "The sky is blue because of Rayleigh scattering.",
      });
      expect(ingest.send).toHaveBeenCalledTimes(1);
      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.type).toBe("llm_call");
      expect(payload.event.name).toBe("gemini-2.5-flash");
      expect(payload.event.input).toBe("Why is the sky blue?");
      expect(payload.event.output).toBe(
        "The sky is blue because of Rayleigh scattering.",
      );
    });

    it("captures tool_call events when response has functionCalls", async () => {
      const ingest = createMockIngest();
      const response = {
        text: "",
        functionCalls: [
          { name: "get_weather", args: { location: "SF" } },
          { name: "get_time", args: { timezone: "PST" } },
        ],
      };
      const mockGenerateContent = jest.fn().mockResolvedValue(response);
      const client = {
        models: { generateContent: mockGenerateContent },
      };
      const wrapped = wrapGemini(client, ingest);

      await wrapped.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "What is the weather and time?",
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
      (ingest.send as jest.Mock).mockRejectedValue(new Error("Network error"));
      const { client } = createMockClient();
      const wrapped = wrapGemini(client, ingest);

      const result = await wrapped.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hi",
      });

      expect(result).toEqual({
        text: "The sky is blue because of Rayleigh scattering.",
      });
    });

    it("extracts model name from params", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapGemini(client, ingest);

      await wrapped.models.generateContent({
        model: "gemini-2.5-pro",
        contents: "Hi",
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.name).toBe("gemini-2.5-pro");
    });
  });

  describe("generateContentStream", () => {
    it("captures one event after all chunks are consumed", async () => {
      const ingest = createMockIngest();
      const chunks = [
        { text: "The sky " },
        { text: "is blue " },
        { text: "because of scattering." },
      ];

      async function* fakeStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const mockGenerateContentStream = jest
        .fn()
        .mockResolvedValue(fakeStream());
      const client = {
        models: {
          generateContent: jest.fn(),
          generateContentStream: mockGenerateContentStream,
        },
      };
      const wrapped = wrapGemini(client, ingest);

      const stream = await wrapped.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: "Why is the sky blue?",
      });

      const collected: unknown[] = [];
      for await (const chunk of stream as AsyncIterable<unknown>) {
        collected.push(chunk);
      }
      await tick();

      // All original chunks yielded unchanged
      expect(collected).toEqual(chunks);

      // One event sent after stream completes
      expect(ingest.send).toHaveBeenCalledTimes(1);
      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.type).toBe("llm_call");
      expect(payload.event.name).toBe("gemini-2.5-flash");
      expect(payload.event.output).toBe(
        "The sky is blue because of scattering.",
      );
      expect(payload.event.input).toBe("Why is the sky blue?");
    });

    it("yields all original chunks unchanged", async () => {
      const ingest = createMockIngest();
      const chunks = [
        { text: "Hello", other: 123 },
        { text: " world", other: 456 },
      ];

      async function* fakeStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const mockGenerateContentStream = jest
        .fn()
        .mockResolvedValue(fakeStream());
      const client = {
        models: {
          generateContent: jest.fn(),
          generateContentStream: mockGenerateContentStream,
        },
      };
      const wrapped = wrapGemini(client, ingest);

      const stream = await wrapped.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: "Hi",
      });

      const collected: unknown[] = [];
      for await (const chunk of stream as AsyncIterable<unknown>) {
        collected.push(chunk);
      }

      expect(collected).toEqual(chunks);
    });

    it("returns original result unchanged even if ingest fails", async () => {
      const ingest = createMockIngest();
      (ingest.send as jest.Mock).mockRejectedValue(new Error("fail"));
      const chunks = [{ text: "Hi" }];

      async function* fakeStream() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      const mockGenerateContentStream = jest
        .fn()
        .mockResolvedValue(fakeStream());
      const client = {
        models: {
          generateContent: jest.fn(),
          generateContentStream: mockGenerateContentStream,
        },
      };
      const wrapped = wrapGemini(client, ingest);

      const stream = await wrapped.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: "Hi",
      });

      const collected: unknown[] = [];
      for await (const chunk of stream as AsyncIterable<unknown>) {
        collected.push(chunk);
      }

      expect(collected).toEqual(chunks);
    });
  });

  describe("sessionName", () => {
    it("includes sessionName in ingest payloads", async () => {
      const ingest = createMockIngest();
      const { client } = createMockClient();
      const wrapped = wrapGemini(client, ingest, {
        sessionName: "Gemini task",
      });

      await wrapped.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hi",
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.sessionName).toBe("Gemini task");
    });
  });

  it("passes through non-intercepted properties unchanged", () => {
    const ingest = createMockIngest();
    const { client } = createMockClient();
    const wrapped = wrapGemini(client, ingest);

    expect(wrapped.otherProp).toBe("untouched");
  });
});
