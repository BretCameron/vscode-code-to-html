# "Use Active Theme" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Use active theme" option that loads the user's current VS Code editor theme into Shiki for HTML output.

**Architecture:** New `theme-resolver.ts` module finds and loads the VS Code theme file into a Shiki-compatible `ThemeRegistrationRaw` object. The existing `highlightCode()` is widened to accept custom theme objects alongside bundled theme strings. The sentinel value `"active"` in config triggers resolution.

**Tech Stack:** TypeScript, Shiki (ThemeRegistrationRaw), VS Code extension API (`vscode.extensions.all`, `vscode.workspace.getConfiguration`), jsonc-parser (new dependency)

---

### Task 1: Add jsonc-parser dependency

**Files:**
- Modify: `package.json`

**Step 1: Install jsonc-parser**

Run: `npm install jsonc-parser`

**Step 2: Verify**

Run: `npm ls jsonc-parser`
Expected: `jsonc-parser@x.x.x`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add jsonc-parser dependency"
```

---

### Task 2: Create theme-resolver — findThemeContribution (TDD)

**Files:**
- Create: `src/theme-resolver.ts`
- Create: `src/__tests__/theme-resolver.test.ts`

**Step 1: Write failing tests for findThemeContribution**

`src/__tests__/theme-resolver.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { findThemeContribution } from "../theme-resolver.js";

describe("theme-resolver", () => {
  describe("findThemeContribution", () => {
    const fakeExtensions = [
      {
        extensionPath: "/ext/theme-one",
        packageJSON: {
          contributes: {
            themes: [
              { id: "One Dark Pro", label: "One Dark Pro", path: "./themes/OneDark-Pro.json" },
            ],
          },
        },
      },
      {
        extensionPath: "/ext/dracula",
        packageJSON: {
          contributes: {
            themes: [
              { label: "Dracula", path: "./theme/dracula.json" },
            ],
          },
        },
      },
      {
        extensionPath: "/ext/no-themes",
        packageJSON: { contributes: {} },
      },
    ];

    it("finds theme by id", () => {
      const result = findThemeContribution(fakeExtensions, "One Dark Pro");
      expect(result).toEqual({
        extensionPath: "/ext/theme-one",
        themePath: "/ext/theme-one/themes/OneDark-Pro.json",
      });
    });

    it("finds theme by label when id is missing", () => {
      const result = findThemeContribution(fakeExtensions, "Dracula");
      expect(result).toEqual({
        extensionPath: "/ext/dracula",
        themePath: "/ext/dracula/theme/dracula.json",
      });
    });

    it("returns undefined when theme not found", () => {
      expect(findThemeContribution(fakeExtensions, "Nonexistent")).toBeUndefined();
    });

    it("handles extensions with no contributes.themes", () => {
      expect(findThemeContribution(fakeExtensions, "anything")).toBeUndefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/theme-resolver.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

`src/theme-resolver.ts`:
```typescript
import * as path from "path";

interface ExtensionInfo {
  extensionPath: string;
  packageJSON: any;
}

interface ThemeContribution {
  extensionPath: string;
  themePath: string;
}

export function findThemeContribution(
  extensions: ReadonlyArray<ExtensionInfo>,
  themeId: string
): ThemeContribution | undefined {
  for (const ext of extensions) {
    const themes = ext.packageJSON?.contributes?.themes;
    if (!Array.isArray(themes)) continue;
    for (const t of themes) {
      if (t.id === themeId || t.label === themeId) {
        return {
          extensionPath: ext.extensionPath,
          themePath: path.join(ext.extensionPath, t.path),
        };
      }
    }
  }
  return undefined;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/theme-resolver.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme-resolver.ts src/__tests__/theme-resolver.test.ts
git commit -m "Add findThemeContribution with tests"
```

---

### Task 3: Add JSONC parsing and include resolution (TDD)

**Files:**
- Modify: `src/theme-resolver.ts`
- Modify: `src/__tests__/theme-resolver.test.ts`

**Step 1: Write failing tests for parseThemeFile and mergeThemeWithInclude**

Add to `src/__tests__/theme-resolver.test.ts`:
```typescript
import { parseThemeJson, mergeThemes } from "../theme-resolver.js";

describe("parseThemeJson", () => {
  it("parses valid JSON", () => {
    const result = parseThemeJson('{"name": "test", "colors": {}}');
    expect(result).toEqual({ name: "test", colors: {} });
  });

  it("parses JSONC with comments", () => {
    const jsonc = `{
      // This is a comment
      "name": "test",
      /* block comment */
      "colors": {},
    }`;
    const result = parseThemeJson(jsonc);
    expect(result.name).toBe("test");
  });

  it("handles trailing commas", () => {
    const result = parseThemeJson('{"name": "test", "tokenColors": [],}');
    expect(result.name).toBe("test");
  });
});

describe("mergeThemes", () => {
  it("child overrides parent colors", () => {
    const parent = { name: "parent", colors: { "editor.background": "#000" }, tokenColors: [] };
    const child = { name: "child", colors: { "editor.background": "#fff" } };
    const result = mergeThemes(parent, child);
    expect(result.name).toBe("child");
    expect(result.colors["editor.background"]).toBe("#fff");
  });

  it("merges tokenColors (parent first, child appended)", () => {
    const parent = { name: "parent", colors: {}, tokenColors: [{ scope: "comment", settings: { foreground: "#aaa" } }] };
    const child = { name: "child", tokenColors: [{ scope: "string", settings: { foreground: "#bbb" } }] };
    const result = mergeThemes(parent, child);
    expect(result.tokenColors).toHaveLength(2);
    expect(result.tokenColors[0].scope).toBe("comment");
    expect(result.tokenColors[1].scope).toBe("string");
  });

  it("child without tokenColors inherits parent's", () => {
    const parent = { name: "parent", colors: {}, tokenColors: [{ scope: "a", settings: {} }] };
    const child = { name: "child", colors: {} };
    const result = mergeThemes(parent, child);
    expect(result.tokenColors).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/theme-resolver.test.ts`
Expected: FAIL — functions not exported

**Step 3: Write implementation**

Add to `src/theme-resolver.ts`:
```typescript
import { parse as parseJsonc } from "jsonc-parser";

export function parseThemeJson(content: string): any {
  return parseJsonc(content);
}

export function mergeThemes(parent: any, child: any): any {
  return {
    ...parent,
    ...child,
    colors: { ...parent.colors, ...child.colors },
    tokenColors: [
      ...(parent.tokenColors ?? []),
      ...(child.tokenColors ?? []),
    ],
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/theme-resolver.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/theme-resolver.ts src/__tests__/theme-resolver.test.ts
git commit -m "Add JSONC parsing and theme merging"
```

---

### Task 4: Add loadThemeFromFile with include resolution

**Files:**
- Modify: `src/theme-resolver.ts`

This function has I/O (reads files). Test it in Task 6 (integration). Here we write the implementation.

**Step 1: Add loadThemeFromFile**

Add to `src/theme-resolver.ts`:
```typescript
import * as fs from "fs/promises";
import type { ThemeRegistrationRaw } from "shiki";

export async function loadThemeFromFile(filePath: string): Promise<ThemeRegistrationRaw> {
  const content = await fs.readFile(filePath, "utf-8");
  const theme = parseThemeJson(content);

  if (theme.include) {
    const includePath = path.resolve(path.dirname(filePath), theme.include);
    const parent = await loadThemeFromFile(includePath);
    const { include: _, ...childWithoutInclude } = theme;
    return mergeThemes(parent, childWithoutInclude);
  }

  return theme;
}
```

**Step 2: Run existing tests still pass**

Run: `npx vitest run`
Expected: all PASS

**Step 3: Commit**

```bash
git add src/theme-resolver.ts
git commit -m "Add loadThemeFromFile with include resolution"
```

---

### Task 5: Add resolveActiveTheme orchestrator

**Files:**
- Modify: `src/theme-resolver.ts`

This function uses `vscode` APIs. It's the thin orchestrator.

**Step 1: Add resolveActiveTheme**

Add to `src/theme-resolver.ts`:
```typescript
import * as vscode from "vscode";

const FALLBACK_THEME = "github-dark";

export async function resolveActiveTheme(): Promise<ThemeRegistrationRaw | null> {
  const themeId = vscode.workspace.getConfiguration("workbench").get<string>("colorTheme");
  if (!themeId) return null;

  const contribution = findThemeContribution(vscode.extensions.all, themeId);
  if (!contribution) return null;

  try {
    const theme = await loadThemeFromFile(contribution.themePath);
    if (!theme.name) theme.name = themeId;
    return theme;
  } catch {
    return null;
  }
}
```

**Note:** Returns `null` on failure. The caller (`extension.ts`) handles the fallback + warning.

**Step 2: Run existing tests still pass**

Run: `npx vitest run`
Expected: all PASS (tests don't import `resolveActiveTheme`, so no vscode mock needed)

**Step 3: Commit**

```bash
git add src/theme-resolver.ts
git commit -m "Add resolveActiveTheme orchestrator"
```

---

### Task 6: Widen highlightCode to accept custom themes (TDD)

**Files:**
- Modify: `src/highlighter.ts`
- Modify: `src/__tests__/highlighter.test.ts`

**Step 1: Write failing test for custom theme**

Add to `src/__tests__/highlighter.test.ts`:
```typescript
describe("highlightCode with custom theme", () => {
  it("accepts a ThemeRegistrationRaw object", async () => {
    const customTheme = {
      name: "test-custom-theme",
      colors: { "editor.background": "#1a1a2e" },
      tokenColors: [
        { scope: ["keyword"], settings: { foreground: "#e94560" } },
        { scope: ["string"], settings: { foreground: "#0f3460" } },
      ],
    };
    const html = await highlightCode("const x = 1;", "typescript", customTheme);
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
    expect(html).toContain("const");
  });

  it("uses custom theme background for plaintext", async () => {
    const customTheme = {
      name: "test-plaintext-theme",
      colors: { "editor.background": "#abcdef" },
      tokenColors: [],
      settings: [{ settings: { background: "#abcdef" } }],
    };
    const html = await highlightCode("hello", "plaintext", customTheme);
    expect(html).toContain("background-color:");
    expect(html).toContain("hello");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/highlighter.test.ts`
Expected: FAIL — type error, highlightCode doesn't accept objects

**Step 3: Update highlightCode implementation**

Modify `src/highlighter.ts`:

Change the `highlightCode` signature and implementation:
```typescript
import type { BundledTheme, ThemeRegistrationRaw } from "shiki";

export type ThemeOption = BundledTheme | ThemeRegistrationRaw;

export async function highlightCode(
  code: string,
  lang: string,
  theme: ThemeOption
): Promise<string> {
  const hl = await getHighlighter();

  let themeName: string;
  if (typeof theme === "string") {
    await ensureTheme(hl, theme);
    themeName = theme;
  } else {
    await hl.loadTheme(theme);
    themeName = theme.name ?? "custom";
  }

  if (lang === "plaintext") {
    const bg = hl.getTheme(themeName).bg;
    const escaped = escapeHtml(code);
    return `<pre class="shiki" style="background-color:${bg};padding:1em;overflow-x:auto"><code>${escaped}</code></pre>`;
  }
  await ensureLang(hl, lang as BundledLanguage);
  return hl.codeToHtml(code, { lang, theme: themeName });
}
```

Also export `ThemeOption` type.

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/highlighter.test.ts`
Expected: all PASS

**Step 5: Commit**

```bash
git add src/highlighter.ts src/__tests__/highlighter.test.ts
git commit -m "Widen highlightCode to accept custom theme objects"
```

---

### Task 7: Update BuildOptions and extension wiring

**Files:**
- Modify: `src/html-builder.ts`
- Modify: `src/extension.ts`

**Step 1: Update BuildOptions type**

In `src/html-builder.ts`, change the import and type:
```typescript
import type { ThemeOption } from "./highlighter.js";
// ...
export interface BuildOptions {
  theme: ThemeOption;  // was BundledTheme
  // ... rest unchanged
}
```

**Step 2: Update extension.ts to resolve active theme**

In `src/extension.ts`:
```typescript
import { resolveActiveTheme } from "./theme-resolver.js";
import type { ThemeOption } from "./highlighter.js";

// Change readConfig to be async, or resolve theme separately.
// Cleaner: resolve theme outside readConfig since it's async.

async function resolveTheme(config: vscode.WorkspaceConfiguration): Promise<ThemeOption> {
  const themeSetting = config.get<string>("theme", "active");
  if (themeSetting === "active") {
    const resolved = await resolveActiveTheme();
    if (resolved) return resolved;
    vscode.window.showWarningMessage("Could not load active VS Code theme, using github-dark.");
    return "github-dark";
  }
  return themeSetting as BundledTheme;
}
```

Update `readConfig` to not include theme (it returns sync), and resolve theme separately in `copyFromEditor`, `copyFromExplorer`, and `previewAsHtml`:
```typescript
function readConfig(config: vscode.WorkspaceConfiguration): Omit<BuildOptions, "theme"> {
  return {
    lineNumbers: config.get<boolean>("lineNumbers", false),
    border: config.get<boolean>("border", false),
    showFilePath: config.get<BuildOptions["showFilePath"]>("showFilePath", "filename"),
    languageOverride: config.get<string>("languageOverride", "auto"),
  };
}

// Then in each command handler:
const theme = await resolveTheme(config);
const options = { ...readConfig(config), theme, workspaceRoot };
```

**Step 3: Update selectTheme quick pick**

Add `"active"` as a special first entry:
```typescript
const themeItems = [
  { label: "active", description: themeSetting === "active" ? "current" : "Use current VS Code theme" },
  ...THEMES.map((t) => ({ label: t, description: t === themeSetting ? "current" : undefined })),
];
```

**Step 4: Run all tests**

Run: `npx vitest run`
Expected: all PASS

**Step 5: Commit**

```bash
git add src/html-builder.ts src/extension.ts
git commit -m "Wire up active theme resolution in extension"
```

---

### Task 8: Update package.json configuration

**Files:**
- Modify: `package.json`

**Step 1: Add "active" to theme enum and change default**

In `package.json`, update the `codeToHtml.theme` configuration:
```json
"codeToHtml.theme": {
  "type": "string",
  "default": "active",
  "enum": [
    "active",
    "andromeeda",
    ...existing themes...
  ],
  "enumItemLabels": [
    "Use active VS Code theme",
    "andromeeda",
    ...
  ],
  "description": "Syntax highlighting theme (\"active\" uses your current VS Code theme)"
}
```

**Step 2: Run all tests**

Run: `npx vitest run`
Expected: all PASS

**Step 3: Build extension**

Run: `npm run build`
Expected: no errors

**Step 4: Commit**

```bash
git add package.json
git commit -m "Add 'active' theme option as default in package.json"
```

---

### Task 9: Manual integration test

**Step 1: Test with F5 (Extension Development Host)**

1. Open the extension in VS Code, press F5
2. In the dev host, open a `.ts` file
3. Run "Code to HTML: Copy as HTML" — should use your active VS Code theme
4. Paste in a browser — verify colors match your editor
5. Run "Code to HTML: Select Theme" — verify "active" appears first with "current" label
6. Select a specific bundled theme (e.g. `dracula`) — verify it still works
7. Switch back to "active" — verify it works again

**Step 2: Test edge cases**

1. Install an uncommon theme extension, activate it, verify "active" resolves it
2. Set theme to a theme that uses `include` (most do) — verify colors render
3. Uninstall the active theme extension, try copy — verify fallback + warning

---

## Unresolved Questions

None — all clarified during design.
