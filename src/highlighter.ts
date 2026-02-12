import * as path from "path";
import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
  type BundledTheme,
} from "shiki";

const BUNDLED_LANGS: BundledLanguage[] = [
  "java",
  "c",
  "cpp",
  "python",
  "javascript",
  "typescript",
  "html",
  "css",
  "sql",
  "shellscript",
  "json",
  "xml",
  "markdown",
  "tsx",
  "jsx",
  "yaml",
  "rust",
  "go",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "r",
  "matlab",
  "latex",
  "makefile",
  "dockerfile",
  "csv",
  "toml",
  "ini",
  "bat",
  "powershell",
  "lua",
  "perl",
  "scala",
  "haskell",
  "asm",
];

const THEMES: BundledTheme[] = [
  "github-dark",
  "github-light",
  "nord",
  "one-dark-pro",
  "dracula",
];

const EXT_TO_LANG: Record<string, BundledLanguage> = {
  ".java": "java",
  ".c": "c",
  ".h": "c",
  ".cpp": "cpp",
  ".cxx": "cpp",
  ".cc": "cpp",
  ".hpp": "cpp",
  ".py": "python",
  ".pyw": "python",
  ".js": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".ts": "typescript",
  ".mts": "typescript",
  ".cts": "typescript",
  ".tsx": "tsx",
  ".jsx": "jsx",
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".sql": "sql",
  ".sh": "shellscript",
  ".bash": "shellscript",
  ".zsh": "shellscript",
  ".json": "json",
  ".xml": "xml",
  ".svg": "xml",
  ".md": "markdown",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".rs": "rust",
  ".go": "go",
  ".rb": "ruby",
  ".php": "php",
  ".swift": "swift",
  ".kt": "kotlin",
  ".kts": "kotlin",
  ".r": "r",
  ".R": "r",
  ".m": "matlab",
  ".tex": "latex",
  ".mk": "makefile",
  ".toml": "toml",
  ".ini": "ini",
  ".cfg": "ini",
  ".bat": "bat",
  ".cmd": "bat",
  ".ps1": "powershell",
  ".lua": "lua",
  ".pl": "perl",
  ".pm": "perl",
  ".scala": "scala",
  ".hs": "haskell",
  ".asm": "asm",
  ".s": "asm",
  ".csv": "csv",
};

const FILENAME_TO_LANG: Record<string, BundledLanguage> = {
  Makefile: "makefile",
  Dockerfile: "dockerfile",
  Rakefile: "ruby",
  Gemfile: "ruby",
};

let highlighter: Highlighter | null = null;

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: THEMES,
      langs: BUNDLED_LANGS,
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

export function detectLanguage(
  filePath: string
): BundledLanguage | "plaintext" {
  const basename = path.basename(filePath);
  if (FILENAME_TO_LANG[basename]) {
    return FILENAME_TO_LANG[basename];
  }
  const ext = path.extname(filePath).toLowerCase();
  return EXT_TO_LANG[ext] || "plaintext";
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
