# Contributing

## Setup

```sh
git clone https://github.com/BretCameron/vscode-code-to-html.git
cd vscode-code-to-html
npm install
```

## Development

```sh
npm run watch    # rebuild on change
```

Press **F5** in VS Code to launch the Extension Development Host.

## Testing

```sh
npm test         # run all tests
npx vitest       # watch mode
```

Tests live in `src/__tests__/`. Run them via the VS Code test explorer (Vitest extension) or the CLI.

## Building

```sh
npm run build    # one-off production build
npm run package  # create .vsix package
```

## Pull Requests

1. Create a branch: `feature/description` or `bugfix/description`
2. Make your changes
3. Ensure `npm run build` and `npm test` pass
4. Open a PR against `main`

Keep PRs focused — one feature or fix per PR.
