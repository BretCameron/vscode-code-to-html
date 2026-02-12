import * as path from "path";
import type { BundledTheme } from "shiki";
import { detectLanguage, highlightCode } from "./highlighter.js";

export interface FileEntry {
  absolutePath: string;
  content: string;
}

export interface BuildOptions {
  theme: BundledTheme;
  lineNumbers: boolean;
  showFilePath: "filename" | "relative" | "absolute" | "none";
  workspaceRoot?: string;
}

function getDisplayName(
  absolutePath: string,
  mode: BuildOptions["showFilePath"],
  workspaceRoot?: string
): string | null {
  switch (mode) {
    case "none":
      return null;
    case "absolute":
      return absolutePath;
    case "relative":
      if (workspaceRoot) {
        return path.relative(workspaceRoot, absolutePath);
      }
      return path.basename(absolutePath);
    case "filename":
    default:
      return path.basename(absolutePath);
  }
}

function addLineNumbers(html: string): string {
  // Shiki outputs <pre ...><code>...lines...</code></pre>
  // We inject line numbers by wrapping each line in a table row
  const codeMatch = html.match(
    /(<pre[^>]*><code[^>]*>)([\s\S]*?)(<\/code><\/pre>)/
  );
  if (!codeMatch) return html;

  const [, preOpen, codeContent, preClose] = codeMatch;
  const lines = codeContent.split("\n");
  // Remove trailing empty line from split
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  const numberedLines = lines
    .map((line, i) => {
      const num = i + 1;
      return (
        `<tr>` +
        `<td style="border:none;padding:0 1em 0 0;text-align:right;user-select:none;opacity:0.5;white-space:nowrap;line-height:inherit;font-size:inherit">${num}</td>` +
        `<td style="border:none;padding:0;white-space:pre;line-height:inherit;font-size:inherit">${line}</td>` +
        `</tr>`
      );
    })
    .join("\n");

  // Replace <code> innards with a table
  return (
    preOpen +
    `<table style="border-collapse:collapse;width:100%"><tbody>\n${numberedLines}\n</tbody></table>` +
    preClose
  );
}

export async function buildHtml(
  files: FileEntry[],
  options: BuildOptions
): Promise<string> {
  const parts: string[] = [];

  for (const file of files) {
    const lang = detectLanguage(file.absolutePath);
    let highlighted = await highlightCode(file.content, lang, options.theme);

    if (options.lineNumbers) {
      highlighted = addLineNumbers(highlighted);
    }

    const displayName = files.length > 1
      ? getDisplayName(file.absolutePath, options.showFilePath, options.workspaceRoot)
      : null;

    if (displayName) {
      parts.push(
        `<p style="font-family:monospace;margin:1em 0 0.25em"><strong>${escapeHtml(displayName)}</strong></p>`
      );
    }
    parts.push(highlighted);
  }

  return `<div>\n${parts.join("\n")}\n</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
