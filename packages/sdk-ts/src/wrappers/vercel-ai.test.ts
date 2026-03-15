import type { IngestClient } from "../types";
import { wrapVercelAI } from "./vercel-ai";

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

describe("wrapVercelAI", () => {
  describe("generateText", () => {
    it("captures one llm_call event with correct input and output", async () => {
      const ingest = createMockIngest();
      const original = jest.fn().mockResolvedValue({ text: "Hello world" });
      const wrapped = wrapVercelAI({ generateText: original }, ingest);

      const result = await wrapped.generateText!({
        model: "openai/gpt-4o",
        prompt: "Say hello",
      });
      await tick();

      expect(result).toEqual({ text: "Hello world" });
      expect(ingest.send).toHaveBeenCalledTimes(1);
      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.type).toBe("llm_call");
      expect(payload.event.name).toBe("openai/gpt-4o");
      expect(payload.event.input).toEqual({ prompt: "Say hello" });
      expect(payload.event.output).toBe("Hello world");
      expect(payload.event.metadata).toBeUndefined();
    });

    it("sets structured: true when output param is present", async () => {
      const ingest = createMockIngest();
      const original = jest.fn().mockResolvedValue({
        text: '{"name":"test"}',
        output: { name: "test" },
      });
      const wrapped = wrapVercelAI({ generateText: original }, ingest);

      await wrapped.generateText!({
        model: "openai/gpt-4o",
        prompt: "Give me JSON",
        output: "some-schema",
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.output).toEqual({ name: "test" });
      expect(payload.event.metadata).toEqual({ structured: true });
    });

    it("returns original result unchanged even if ingest fails", async () => {
      const ingest = createMockIngest();
      (ingest.send as jest.Mock).mockRejectedValue(new Error("Network error"));
      const original = jest.fn().mockResolvedValue({ text: "Hello" });
      const wrapped = wrapVercelAI({ generateText: original }, ingest);

      const result = await wrapped.generateText!({
        model: "openai/gpt-4o",
        prompt: "Hi",
      });

      expect(result).toEqual({ text: "Hello" });
    });
  });

  describe("streamText", () => {
    it("captures one event after text promise resolves", async () => {
      const ingest = createMockIngest();
      const textPromise = Promise.resolve("Streamed text");
      const original = jest
        .fn()
        .mockResolvedValue({ text: textPromise, stream: "fake" });
      const wrapped = wrapVercelAI({ streamText: original }, ingest);

      const result = await wrapped.streamText!({
        model: "openai/gpt-4o",
        prompt: "Stream me",
      });

      await textPromise;
      await tick();

      expect(ingest.send).toHaveBeenCalledTimes(1);
      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.type).toBe("llm_call");
      expect(payload.event.output).toBe("Streamed text");
      expect(result).toEqual({ text: textPromise, stream: "fake" });
    });

    it("returns original result unchanged even if ingest fails", async () => {
      const ingest = createMockIngest();
      (ingest.send as jest.Mock).mockRejectedValue(new Error("fail"));
      const textPromise = Promise.resolve("Hello");
      const original = jest.fn().mockResolvedValue({ text: textPromise });
      const wrapped = wrapVercelAI({ streamText: original }, ingest);

      const result = await wrapped.streamText!({
        model: "openai/gpt-4o",
        prompt: "Hi",
      });
      await textPromise;
      await tick();

      expect(result).toEqual({ text: textPromise });
    });
  });

  describe("generateObject", () => {
    it("captures one event with structured: true", async () => {
      const ingest = createMockIngest();
      const obj = { name: "Acme", score: 42 };
      const original = jest.fn().mockResolvedValue({ object: obj });
      const wrapped = wrapVercelAI({ generateObject: original }, ingest);

      const result = await wrapped.generateObject!({
        model: { modelId: "gpt-4o" },
        prompt: "Extract data",
        schema: {},
      });
      await tick();

      expect(result).toEqual({ object: obj });
      expect(ingest.send).toHaveBeenCalledTimes(1);
      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.type).toBe("llm_call");
      expect(payload.event.output).toEqual(obj);
      expect(payload.event.metadata).toEqual({ structured: true });
    });

    it("returns original result unchanged even if ingest fails", async () => {
      const ingest = createMockIngest();
      (ingest.send as jest.Mock).mockRejectedValue(new Error("fail"));
      const original = jest.fn().mockResolvedValue({ object: { x: 1 } });
      const wrapped = wrapVercelAI({ generateObject: original }, ingest);

      const result = await wrapped.generateObject!({
        model: "openai/gpt-4o",
        prompt: "data",
      });

      expect(result).toEqual({ object: { x: 1 } });
    });
  });

  describe("streamObject", () => {
    it("captures one event with structured: true after object promise resolves", async () => {
      const ingest = createMockIngest();
      const objectPromise = Promise.resolve({ status: "done" });
      const original = jest
        .fn()
        .mockResolvedValue({ object: objectPromise, partialStream: "fake" });
      const wrapped = wrapVercelAI({ streamObject: original }, ingest);

      const result = await wrapped.streamObject!({
        model: "openai/gpt-4o",
        prompt: "Stream object",
        schema: {},
      });

      await objectPromise;
      await tick();

      expect(ingest.send).toHaveBeenCalledTimes(1);
      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.type).toBe("llm_call");
      expect(payload.event.output).toEqual({ status: "done" });
      expect(payload.event.metadata).toEqual({ structured: true });
      expect(result).toEqual({
        object: objectPromise,
        partialStream: "fake",
      });
    });

    it("returns original result unchanged even if ingest fails", async () => {
      const ingest = createMockIngest();
      (ingest.send as jest.Mock).mockRejectedValue(new Error("fail"));
      const objectPromise = Promise.resolve({ x: 1 });
      const original = jest.fn().mockResolvedValue({ object: objectPromise });
      const wrapped = wrapVercelAI({ streamObject: original }, ingest);

      const result = await wrapped.streamObject!({
        model: "openai/gpt-4o",
        prompt: "data",
      });
      await objectPromise;
      await tick();

      expect(result).toEqual({ object: objectPromise });
    });
  });

  describe("model name extraction", () => {
    it("uses string model directly", async () => {
      const ingest = createMockIngest();
      const original = jest.fn().mockResolvedValue({ text: "hi" });
      const wrapped = wrapVercelAI({ generateText: original }, ingest);

      await wrapped.generateText!({
        model: "anthropic/claude-sonnet-4",
        prompt: "hi",
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.name).toBe("anthropic/claude-sonnet-4");
    });

    it("extracts modelId from provider function result", async () => {
      const ingest = createMockIngest();
      const original = jest.fn().mockResolvedValue({ text: "hi" });
      const wrapped = wrapVercelAI({ generateText: original }, ingest);

      await wrapped.generateText!({
        model: { modelId: "gpt-4o", provider: "openai" },
        prompt: "hi",
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.name).toBe("gpt-4o");
    });

    it("falls back to unknown when model is neither string nor has modelId", async () => {
      const ingest = createMockIngest();
      const original = jest.fn().mockResolvedValue({ text: "hi" });
      const wrapped = wrapVercelAI({ generateText: original }, ingest);

      await wrapped.generateText!({ model: 42, prompt: "hi" });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.event.name).toBe("unknown");
    });
  });

  describe("sessionName", () => {
    it("includes sessionName in ingest payloads when provided", async () => {
      const ingest = createMockIngest();
      const original = jest.fn().mockResolvedValue({ text: "hi" });
      const wrapped = wrapVercelAI({ generateText: original }, ingest, {
        sessionName: "My task",
      });

      await wrapped.generateText!({
        model: "openai/gpt-4o",
        prompt: "hi",
      });
      await tick();

      const payload = (ingest.send as jest.Mock).mock.calls[0][0];
      expect(payload.sessionName).toBe("My task");
    });
  });

  describe("missing sessionId", () => {
    it("still calls the original function", async () => {
      const ingest = createMockIngest();
      const original = jest.fn().mockResolvedValue({ text: "hi" });
      const wrapped = wrapVercelAI({ generateText: original }, ingest);

      const result = await wrapped.generateText!({
        model: "openai/gpt-4o",
        prompt: "hi",
      });

      expect(original).toHaveBeenCalled();
      expect(result).toEqual({ text: "hi" });
    });
  });
});
