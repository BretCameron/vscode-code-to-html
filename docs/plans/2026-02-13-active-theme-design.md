# Design: "Use Active Theme" Option

## Summary

Add a theme option that loads the user's current VS Code editor theme directly into Shiki, so HTML output matches what they see in the editor.

## Approach

Always load the VS Code theme file into Shiki as a custom TextMate theme. One code path, maximum fidelity.

## Configuration

- Add `"active"` to the `codeToHtml.theme` enum in `package.json`
- Make `"active"` the new default
- Add it as a special entry in the `selectTheme` quick pick

## Theme Resolution (`src/theme-resolver.ts`)

New module with core function `resolveActiveTheme() → ThemeRegistrationRaw`:

1. Read `workbench.colorTheme` to get active theme ID
2. Search `vscode.extensions.all` for extension contributing that theme (match on `id` or `label`)
3. Read theme JSON file from extension directory
4. Recursively resolve `"include"` fields (parent first, child overrides)
5. Return merged Shiki-compatible theme object

**JSONC:** Add `jsonc-parser` dependency for parsing theme files with comments/trailing commas.

**Caching:** None — resolve fresh each invocation. Theme changes are infrequent relative to copy operations.

**Fallback:** If resolution fails, fall back to `github-dark` + show warning.

## Highlighter Changes (`src/highlighter.ts`)

- Widen `highlightCode()` to accept `BundledTheme | ThemeRegistrationRaw`
- When custom theme object passed: load via `hl.loadTheme(theme)`, use `name` field as identifier

## Builder Changes (`src/html-builder.ts`)

- Widen `BuildOptions.theme` type to `BundledTheme | ThemeRegistrationRaw`
- No logic changes — passes theme through to `highlightCode()`

## Extension Changes (`src/extension.ts`)

- `readConfig()`: when theme is `"active"`, call `resolveActiveTheme()`
- Resolution happens once per command invocation, before `buildHtml()`

## Testing

- `theme-resolver.test.ts`: mock `vscode.extensions.all`, test id/label matching, include resolution, JSONC parsing, fallback
- `highlighter.test.ts`: add test for custom theme object path

## Out of Scope

- `onDidChangeActiveColorTheme` listener (no live reaction)
- `workbench.preferredDarkColorTheme` / `preferredLightColorTheme`
- `editor.tokenColorCustomizations` user overrides
