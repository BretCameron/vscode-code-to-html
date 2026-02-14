import * as path from "path";
import type { ThemeOption } from "./highlighter.js";
import { detectLanguage, highlightCode } from "./highlighter.js";
import { escapeHtml } from "./utils.js";

export interface FileEntry {
  absolutePath: string;
  content: string;
  startLine?: number;
}

export interface BuildOptions {
  theme: ThemeOption;
  lineNumbers: boolean;
  border: boolean;
  wordWrap: boolean;
  showFilePath: "filename" | "relative" | "absolute" | "none";
  workspaceRoot?: string;
  languageOverride?: string;
}

function getDisplayName(
  absolutePath: string,
  mode: BuildOptions["showFilePath"],
  workspaceRoot?: string,
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

function stripClasses(html: string): string {
  return html.replace(/ class="[^"]*"/g, "").replace(/ tabindex="[^"]*"/g, "");
}

function addWordWrap(html: string): string {
  return html.replace(
    /(<pre[^>]*style=")/,
    "$1white-space:pre-wrap;word-wrap:break-word;",
  );
}

function addBorder(html: string): string {
  // Shiki's <pre> already has a style attribute — inject border into it
  return html.replace(
    /(<pre[^>]*style=")/,
    "$1border:1px solid #d0d7de;border-radius:6px;",
  );
}

function addLineNumbers(html: string, startLine = 1): string {
  // Shiki outputs <pre ...><code>...lines...</code></pre>
  // We inject line numbers by wrapping each line in a table row
  const codeMatch = html.match(
    /(<pre[^>]*><code[^>]*>)([\s\S]*?)(<\/code><\/pre>)/,
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
      const num = startLine + i;
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
  options: BuildOptions,
): Promise<string> {
  const parts: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const lang =
      options.languageOverride && options.languageOverride !== "auto"
        ? options.languageOverride
        : detectLanguage(file.absolutePath);
    let highlighted = stripClasses(
      await highlightCode(file.content, lang, options.theme),
    );

    if (options.wordWrap) {
      highlighted = addWordWrap(highlighted);
    }

    if (options.lineNumbers) {
      highlighted = addLineNumbers(highlighted, file.startLine);
    }

    if (options.border) {
      highlighted = addBorder(highlighted);
    }

    const displayName = getDisplayName(
      file.absolutePath,
      options.showFilePath,
      options.workspaceRoot,
    );

    if (displayName) {
      const topMargin = i === 0 ? "0" : "1em";
      parts.push(
        `<p style="font-family:inherit;margin:${topMargin} 0 0.25em"><strong>${escapeHtml(displayName)}</strong></p>`,
      );
    }
    parts.push(highlighted);
  }

  return `<div style="max-width:100%;overflow:auto">\n${parts.join("\n")}\n</div>`;
}

export { escapeHtml } from "./utils.js";
