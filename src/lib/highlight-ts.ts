/**
 * Lightweight TypeScript syntax highlighter.
 * Returns an HTML string with <span> tags for use with dangerouslySetInnerHTML.
 */

const KEYWORDS = new Set([
  "import",
  "from",
  "export",
  "default",
  "const",
  "let",
  "var",
  "function",
  "return",
  "type",
  "interface",
  "class",
  "new",
  "async",
  "await",
  "if",
  "else",
  "typeof",
  "extends",
  "implements",
  "readonly",
  "as",
  "of",
  "in",
  "for",
  "while",
  "throw",
  "try",
  "catch",
  "finally",
]);

const BUILTIN_TYPES = new Set([
  "string",
  "number",
  "boolean",
  "unknown",
  "void",
  "null",
  "undefined",
  "true",
  "false",
  "never",
  "any",
  "object",
  "Promise",
  "Record",
  "Array",
  "Partial",
  "Required",
  "Pick",
  "Omit",
]);

export function highlightTs(code: string): string {
  return code.split("\n").map(processLine).join("\n");
}

function processLine(line: string): string {
  let result = "";
  let i = 0;

  while (i < line.length) {
    // Single-line comments
    if (line[i] === "/" && line[i + 1] === "/") {
      result += `<span class="text-zinc-500">${esc(line.slice(i))}</span>`;
      break;
    }

    // Strings (single, double, backtick)
    if (line[i] === "'" || line[i] === '"' || line[i] === "`") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === "\\") j++;
        j++;
      }
      result += `<span class="text-[#98c379]">${esc(line.slice(i, j + 1))}</span>`;
      i = j + 1;
      continue;
    }

    // Word tokens (keywords, types, identifiers)
    const wordMatch = line.slice(i).match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      if (KEYWORDS.has(word)) {
        result += `<span class="text-[#c678dd]">${esc(word)}</span>`;
      } else if (BUILTIN_TYPES.has(word)) {
        result += `<span class="text-[#e5c07b]">${esc(word)}</span>`;
      } else {
        result += `<span class="text-[#cdd6f4]">${esc(word)}</span>`;
      }
      i += word.length;
      continue;
    }

    // Numbers (no negative to avoid ambiguity with minus operator)
    if (/\d/.test(line[i]) && (i === 0 || !/[a-zA-Z_$]/.test(line[i - 1]))) {
      const numMatch = line.slice(i).match(/^\d+(\.\d+)?/);
      if (numMatch) {
        result += `<span class="text-[#d19a66]">${esc(numMatch[0])}</span>`;
        i += numMatch[0].length;
        continue;
      }
    }

    // Everything else (punctuation, whitespace, operators)
    result += esc(line[i]);
    i++;
  }

  return result;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
