# Code to HTML

Copy syntax-highlighted code as HTML — for blog posts, forums, emails, docs and more.

Right-click any file (or multiple files) in the Explorer and select **Copy as HTML**. The syntax-highlighted HTML is copied to your clipboard, ready to paste.

## Features

- **Syntax highlighting** powered by [Shiki](https://shiki.matsu.io/) — the same engine behind VS Code's syntax highlighting
- **40+ languages** including TypeScript, Python, Rust, Go, C++, Ruby, Shell, and many more
- **Multiple files** — select several files at once to copy them all in one block
- **5 color themes** — GitHub Dark, GitHub Light, Nord, One Dark Pro, Dracula
- **Optional line numbers** with proper alignment and non-selectable styling
- **File path headers** — show the filename, relative path, absolute path, or nothing above each code block

## Usage

1. In the Explorer sidebar, right-click a file (or select multiple files)
2. Click **Copy as HTML**
3. Paste the HTML wherever you need it

Binary files and files over 1 MB are automatically skipped.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `codeToHtml.theme` | `github-dark` | Color theme. Options: `github-dark`, `github-light`, `nord`, `one-dark-pro`, `dracula` |
| `codeToHtml.lineNumbers` | `false` | Include line numbers in the output |
| `codeToHtml.showFilePath` | `filename` | File path display above each code block. Options: `filename`, `relative`, `absolute`, `none` |

## Supported Languages

Assembly, C, C++, CSS, CSV, Dockerfile, Go, Haskell, HTML, INI, Java, JavaScript, JSON, JSX, Kotlin, LaTeX, Lua, Makefile, Markdown, MATLAB, Perl, PHP, PowerShell, Python, R, Ruby, Rust, Scala, Shell/Bash, SQL, Swift, TOML, TSX, TypeScript, XML, YAML, and more. Unrecognised file types are copied as plain text.

## License

MIT
