"use client";

import { useState } from "react";
import { highlightTs } from "@/lib/highlight-ts";

type CodeBlockProps = {
  code: string;
  language?: "typescript" | "bash";
  filename?: string;
};

export function CodeBlock({
  code,
  language = "typescript",
  filename,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const trimmed = code.trim();
  const html =
    language === "typescript" ? highlightTs(trimmed) : escapeHtml(trimmed);

  const copy = () => {
    navigator.clipboard.writeText(trimmed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-border bg-[#1e1e2e]">
      {filename && (
        <div className="flex items-center border-b border-white/[0.06] px-4 py-2.5">
          <span className="text-xs text-white/40">{filename}</span>
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={copy}
          className="absolute right-3 top-3 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/40 opacity-0 transition-opacity hover:bg-white/10 hover:text-white/60 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-[#cdd6f4]">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
