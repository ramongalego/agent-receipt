/**
 * Lightweight JSON syntax highlighter.
 * Returns an HTML string with <span> tags using Tailwind color classes.
 * Designed for use with dangerouslySetInnerHTML on a <pre> element.
 */
export function highlightJson(json: string): string {
  return json.replace(
    /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=[,\s\]}]|$)|\b(true|false)\b|\b(null)\b|([{}[\],:])/g,
    (
      match: string,
      key: string | undefined,
      str: string | undefined,
      num: string | undefined,
      bool: string | undefined,
      nil: string | undefined,
      punct: string | undefined,
    ) => {
      if (key !== undefined) {
        return `<span class="text-blue-300">${escape(key)}</span><span class="text-zinc-400">:</span>`;
      }
      if (str !== undefined) {
        return `<span class="text-green-300">${escape(str)}</span>`;
      }
      if (num !== undefined) {
        return `<span class="text-amber-300">${escape(num)}</span>`;
      }
      if (bool !== undefined) {
        return `<span class="text-purple-300">${escape(bool)}</span>`;
      }
      if (nil !== undefined) {
        return `<span class="text-zinc-500">${escape(nil)}</span>`;
      }
      if (punct !== undefined) {
        return `<span class="text-zinc-400">${escape(punct)}</span>`;
      }
      return escape(match);
    },
  );
}

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
