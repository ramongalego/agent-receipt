import { highlightJson } from "./highlight";

describe("highlightJson", () => {
  it("highlights object keys in blue", () => {
    const result = highlightJson('"name": "Alice"');
    expect(result).toContain('class="text-blue-700 dark:text-blue-300"');
    expect(result).toMatch(
      /<span class="text-blue-700 dark:text-blue-300">"name"<\/span>/,
    );
  });

  it("highlights string values in green", () => {
    const result = highlightJson('"name": "Alice"');
    expect(result).toMatch(
      /<span class="text-green-700 dark:text-green-300">"Alice"<\/span>/,
    );
  });

  it("highlights numbers in amber", () => {
    const result = highlightJson('"count": 42');
    expect(result).toMatch(
      /<span class="text-amber-700 dark:text-amber-300">42<\/span>/,
    );
  });

  it("highlights negative and decimal numbers", () => {
    const result = highlightJson('"val": -3.14');
    expect(result).toMatch(
      /<span class="text-amber-700 dark:text-amber-300">-3.14<\/span>/,
    );
  });

  it("highlights booleans in purple", () => {
    const result = highlightJson('"active": true');
    expect(result).toMatch(
      /<span class="text-purple-700 dark:text-purple-300">true<\/span>/,
    );
  });

  it("highlights false in purple", () => {
    const result = highlightJson('"done": false');
    expect(result).toMatch(
      /<span class="text-purple-700 dark:text-purple-300">false<\/span>/,
    );
  });

  it("highlights null in zinc", () => {
    const result = highlightJson('"missing": null');
    expect(result).toMatch(
      /<span class="text-zinc-400 dark:text-zinc-500">null<\/span>/,
    );
  });

  it("highlights brackets and punctuation in zinc", () => {
    const result = highlightJson("{}");
    expect(result).toMatch(
      /<span class="text-zinc-500 dark:text-zinc-400">\{<\/span>/,
    );
    expect(result).toMatch(
      /<span class="text-zinc-500 dark:text-zinc-400">}<\/span>/,
    );
  });

  it("highlights colons as punctuation after keys", () => {
    const result = highlightJson('"key": 1');
    expect(result).toMatch(
      /<span class="text-zinc-500 dark:text-zinc-400">:<\/span>/,
    );
  });

  it("highlights array brackets and commas", () => {
    const result = highlightJson("[1, 2]");
    expect(result).toContain(
      '<span class="text-zinc-500 dark:text-zinc-400">[</span>',
    );
    expect(result).toContain(
      '<span class="text-zinc-500 dark:text-zinc-400">]</span>',
    );
    expect(result).toContain(
      '<span class="text-zinc-500 dark:text-zinc-400">,</span>',
    );
  });

  it("escapes HTML entities in string values", () => {
    const result = highlightJson('"html": "<b>bold</b>"');
    expect(result).toContain("&lt;b&gt;bold&lt;/b&gt;");
    expect(result).not.toContain("<b>");
  });

  it("handles a complete JSON object", () => {
    const json = JSON.stringify({ name: "test", count: 5, ok: true }, null, 2);
    const result = highlightJson(json);
    expect(result).toContain("text-blue-700");
    expect(result).toContain("text-green-700");
    expect(result).toContain("text-amber-700");
    expect(result).toContain("text-purple-700");
    expect(result).toContain("text-zinc-500");
  });
});
