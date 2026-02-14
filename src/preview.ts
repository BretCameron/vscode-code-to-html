import * as crypto from "crypto";
import * as vscode from "vscode";

let panel: vscode.WebviewPanel | null = null;
let onRefresh: (() => Promise<void>) | null = null;

export function showPreview(
  html: string,
  refresh: () => Promise<void>,
  title = "Code to HTML Preview",
): void {
  onRefresh = refresh;

  if (panel) {
    panel.title = title;
    panel.webview.html = wrapHtml(html);
    panel.reveal();
    return;
  }

  panel = vscode.window.createWebviewPanel(
    "codeToHtmlPreview",
    title,
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
    onRefresh = null;
  });
}

export async function refreshPreview(): Promise<void> {
  if (panel && onRefresh) {
    await onRefresh();
  }
}

export function isPreviewOpen(): boolean {
  return panel !== null;
}

export function updatePreviewHtml(html: string): void {
  if (panel) {
    panel.webview.html = wrapHtml(html);
  }
}

function wrapHtml(html: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
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
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const rawHtml = document.querySelector('.preview').innerHTML;
  document.getElementById('copyBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'copy', html: rawHtml });
  });
</script>
</body>
</html>`;
}
