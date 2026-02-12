import * as path from "path";
import {
  createHighlighter,
  bundledLanguages,
  type Highlighter,
  type BundledLanguage,
  type BundledTheme,
} from "shiki";

const ALL_LANG_IDS = Object.keys(bundledLanguages) as BundledLanguage[];

export const THEMES: BundledTheme[] = [
  "github-dark",
  "github-light",
  "dracula",
  "nord",
  "one-dark-pro",
  "monokai",
  "solarized-dark",
  "solarized-light",
  "night-owl",
  "catppuccin-mocha",
];

let highlighter: Highlighter | null = null;

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: THEMES,
      langs: ALL_LANG_IDS,
    });
  }
  return highlighter;
}

export async function resetHighlighter(): Promise<void> {
  if (highlighter) {
    highlighter.dispose();
    highlighter = null;
  }
}

const LANG_SET = new Set<string>(ALL_LANG_IDS);

// Extensions not directly recognized as Shiki language IDs
const EXT_ALIASES: Record<string, BundledLanguage> = {
  htm: "html",
  mjs: "javascript",
  cjs: "javascript",
  mts: "typescript",
  cts: "typescript",
  cxx: "cpp",
  cc: "cpp",
  hpp: "cpp",
  h: "c",
  pyw: "python",
  svg: "xml",
  cfg: "ini",
  mk: "makefile",
  pm: "perl",
  s: "asm",
};

export function detectLanguage(
  filePath: string
): BundledLanguage | "plaintext" {
  const basename = path.basename(filePath);
  const lower = basename.toLowerCase();
  if (LANG_SET.has(lower)) return lower as BundledLanguage;

  const ext = path.extname(filePath).toLowerCase().slice(1);
  if (ext && LANG_SET.has(ext)) return ext as BundledLanguage;
  if (ext && EXT_ALIASES[ext]) return EXT_ALIASES[ext];

  return "plaintext";
}

export async function highlightCode(
  code: string,
  lang: string,
  theme: BundledTheme
): Promise<string> {
  const hl = await getHighlighter();
  if (lang === "plaintext") {
    // Shiki doesn't handle plaintext well — just wrap in <pre>
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<pre style="padding:1em;overflow-x:auto"><code>${escaped}</code></pre>`;
  }
  return hl.codeToHtml(code, { lang, theme });
}
