import { createProjectSchema, updateProjectSchema } from "./project";

describe("createProjectSchema", () => {
  it("accepts valid input with name and description", () => {
    const result = createProjectSchema.safeParse({
      name: "Invoice Processor",
      description: "Processes invoices automatically",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with name only", () => {
    const result = createProjectSchema.safeParse({
      name: "Invoice Processor",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty description", () => {
    const result = createProjectSchema.safeParse({
      name: "Invoice Processor",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createProjectSchema.safeParse({
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = createProjectSchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("rejects description over 500 characters", () => {
    const result = createProjectSchema.safeParse({
      name: "Test",
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProjectSchema", () => {
  it("accepts partial updates with name only", () => {
    const result = updateProjectSchema.safeParse({
      name: "New Name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    const result = updateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
