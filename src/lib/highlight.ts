const TOKEN =
  /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=[,\s\]}]|$)|\b(true|false)\b|\b(null)\b|([{}[\],:])/g;

/**
 * Lightweight JSON syntax highlighter.
 * Returns an HTML string with <span> tags using Tailwind color classes.
 * Designed for use with dangerouslySetInnerHTML on a <pre> element.
 *
 * Every character of the input is escaped, including the text between
 * tokens. Payloads come from agents and whatever those agents read. The
 * "pretty" view also unescapes \n before highlighting, so the input isn't
 * guaranteed to be valid JSON. Unmatched text must never pass through raw.
 */
export function highlightJson(json: string): string {
  let html = "";
  let last = 0;
  for (const match of json.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    html += escape(json.slice(last, index));
    html += renderToken(match);
    last = index + match[0].length;
  }
  return html + escape(json.slice(last));
}

function renderToken(match: RegExpMatchArray): string {
  const [whole, key, str, num, bool, nil, punct] = match;
  if (key !== undefined) {
    return `<span class="text-blue-700 dark:text-blue-300">${escape(key)}</span><span class="text-zinc-500 dark:text-zinc-400">:</span>`;
  }
  if (str !== undefined) {
    return `<span class="text-green-700 dark:text-green-300">${escape(str)}</span>`;
  }
  if (num !== undefined) {
    return `<span class="text-amber-700 dark:text-amber-300">${escape(num)}</span>`;
  }
  if (bool !== undefined) {
    return `<span class="text-purple-700 dark:text-purple-300">${escape(bool)}</span>`;
  }
  if (nil !== undefined) {
    return `<span class="text-zinc-400 dark:text-zinc-500">${escape(nil)}</span>`;
  }
  if (punct !== undefined) {
    return `<span class="text-zinc-500 dark:text-zinc-400">${escape(punct)}</span>`;
  }
  return escape(whole);
}

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
