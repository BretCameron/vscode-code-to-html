# Code to HTML

Copy syntax-highlighted code as HTML — for blog posts, forums, emails, docs and more.

Right-click any file (or multiple files) in the Explorer and select **Copy as HTML**. You can also use the keyboard shortcut or command palette.

## Features

- **Syntax highlighting** powered by [Shiki](https://shiki.matsu.io/) — the same engine behind VS Code's syntax highlighting
- **300+ languages** including TypeScript, Python, Rust, Go, C++, Ruby, Shell, and many more
- **54 color themes** — all built-in Shiki themes, loaded on demand
- **Multiple files** — select several files at once to copy them all in one block
- **Optional line numbers** with proper alignment and non-selectable styling
- **Line number offset** — selections preserve their original editor line numbers
- **File path headers** — show the filename, relative path, absolute path, or nothing above each code block
- **Language override** — force a specific language instead of auto-detection
- **Live preview** — preview the rendered HTML in a webview before copying

## Usage

- **Explorer**: Right-click a file (or select multiple) → **Copy as HTML**
- **Editor**: Right-click → **Copy as HTML**, or use the keyboard shortcut
- **Command Palette**: `Cmd+Shift+P` → "Code to HTML: Copy as HTML", "Preview as HTML", plus quick commands for Select Theme, Toggle Line Numbers, Toggle Border, Select File Path Display, and Select Language Override
- **Keyboard shortcut**: `Cmd+Shift+H` (Mac) / `Ctrl+Shift+H` (Windows/Linux)

Binary files and files over 1 MB are automatically skipped.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `codeToHtml.theme` | `github-dark` | Color theme (54 Shiki themes available) |
| `codeToHtml.lineNumbers` | `false` | Include line numbers in the output |
| `codeToHtml.border` | `false` | Add a light grey border around code blocks |
| `codeToHtml.showFilePath` | `filename` | File path display above each code block. Options: `filename`, `relative`, `absolute`, `none` |
| `codeToHtml.languageOverride` | `auto` | Override auto-detected language. Set to a Shiki language ID or `auto` |

## Supported Languages

300+ languages — every language supported by [Shiki](https://shiki.matsu.io/languages), including TypeScript, Python, Rust, Go, C/C++, Java, Ruby, PHP, Swift, Kotlin, Shell, SQL, and many more. Unrecognised file types are copied as plain text.

## License

MIT
