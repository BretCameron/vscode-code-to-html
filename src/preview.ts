import * as vscode from "vscode";

let panel: vscode.WebviewPanel | null = null;

export function showPreview(html: string): void {
  if (panel) {
    panel.webview.html = wrapHtml(html);
    panel.reveal();
    return;
  }

  panel = vscode.window.createWebviewPanel(
    "codeToHtmlPreview",
    "Code to HTML Preview",
    vscode.ViewColumn.Beside,
    { enableScripts: true },
  );

  panel.webview.html = wrapHtml(html);

  panel.webview.onDidReceiveMessage((msg) => {
    if (msg.type === "copy") {
      vscode.env.clipboard.writeText(msg.html);
      vscode.window.showInformationMessage("Copied HTML to clipboard");
    }
  });

  panel.onDidDispose(() => {
    panel = null;
  });
}

function wrapHtml(html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { padding: 16px; font-family: system-ui, sans-serif; }
  .toolbar { margin-bottom: 12px; }
  .toolbar button {
    padding: 6px 14px;
    cursor: pointer;
    background: var(--vscode-button-background, #007acc);
    color: var(--vscode-button-foreground, #fff);
    border: none;
    border-radius: 4px;
    font-size: 13px;
  }
  .toolbar button:hover {
    background: var(--vscode-button-hoverBackground, #005f9e);
  }
  .preview { margin-top: 8px; }
  .preview pre * { background: transparent !important; }
</style>
</head>
<body>
<div class="toolbar">
  <button id="copyBtn">Copy HTML</button>
</div>
<div class="preview">${html}</div>
<script>
  const vscode = acquireVsCodeApi();
  const rawHtml = document.querySelector('.preview').innerHTML;
  document.getElementById('copyBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'copy', html: rawHtml });
  });
</script>
</body>
</html>`;
}
