import { ok, err } from "./result";

describe("Result utilities", () => {
  it("ok wraps a value", () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("err wraps an error with a code", () => {
    const result = err("not found", "NOT_FOUND");
    expect(result).toEqual({
      ok: false,
      error: "not found",
      code: "NOT_FOUND",
    });
  });
});
