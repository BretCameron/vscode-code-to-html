import * as vscode from "vscode";
import * as fs from "fs/promises";
import type { BundledTheme } from "shiki";
import { resetHighlighter } from "./highlighter.js";
import { buildHtml, type BuildOptions, type FileEntry } from "./html-builder.js";

async function copyFromEditor(
  config: vscode.WorkspaceConfiguration,
  workspaceRoot: string | undefined
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor.");
    return;
  }

  const theme = config.get<string>("theme", "github-dark") as BundledTheme;
  const lineNumbers = config.get<boolean>("lineNumbers", false);
  const showFilePath = config.get<BuildOptions["showFilePath"]>("showFilePath", "filename");

  const selection = editor.selection;
  const hasSelection = !selection.isEmpty;
  const content = hasSelection
    ? editor.document.getText(selection)
    : editor.document.getText();

  const filePath = editor.document.uri.fsPath;
  const files: FileEntry[] = [{ absolutePath: filePath, content }];

  const html = await buildHtml(files, { theme, lineNumbers, showFilePath, workspaceRoot });
  await vscode.env.clipboard.writeText(html);

  const what = hasSelection ? "selection" : "file";
  vscode.window.showInformationMessage(`Copied ${what} as HTML`);
}

async function copyFromExplorer(
  uris: vscode.Uri[],
  config: vscode.WorkspaceConfiguration,
  workspaceRoot: string | undefined
): Promise<void> {
  const theme = config.get<string>("theme", "github-dark") as BundledTheme;
  const lineNumbers = config.get<boolean>("lineNumbers", false);
  const showFilePath = config.get<BuildOptions["showFilePath"]>("showFilePath", "filename");

  const files: FileEntry[] = [];
  const skipped: string[] = [];

  for (const u of uris) {
    try {
      const stat = await fs.stat(u.fsPath);
      if (!stat.isFile()) { skipped.push(u.fsPath); continue; }
      if (stat.size > 1_000_000) { skipped.push(u.fsPath); continue; }
      const buf = await fs.readFile(u.fsPath);
      const sample = buf.subarray(0, 8192);
      if (sample.includes(0)) { skipped.push(u.fsPath); continue; }
      files.push({ absolutePath: u.fsPath, content: buf.toString("utf-8") });
    } catch {
      skipped.push(u.fsPath);
    }
  }

  if (files.length === 0) {
    vscode.window.showWarningMessage("No readable text files selected.");
    return;
  }

  const html = await buildHtml(files, { theme, lineNumbers, showFilePath, workspaceRoot });
  await vscode.env.clipboard.writeText(html);

  let msg = `Copied ${files.length} file(s) as HTML`;
  if (skipped.length) { msg += ` (${skipped.length} skipped)`; }
  vscode.window.showInformationMessage(msg);
}

export function activate(context: vscode.ExtensionContext) {
  const cmd = vscode.commands.registerCommand(
    "codeToHtml.copyAsHtml",
    async (uri: vscode.Uri, allUris: vscode.Uri[]) => {
      const config = vscode.workspace.getConfiguration("codeToHtml");
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

      try {
        const uris = allUris?.length ? allUris : uri ? [uri] : [];
        if (uris.length === 0) {
          // Invoked from command palette or editor context menu — use active editor
          await copyFromEditor(config, workspaceRoot);
        } else {
          // Invoked from explorer context menu
          await copyFromExplorer(uris, config, workspaceRoot);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Code to HTML failed: ${errMsg}`);
      }
    }
  );

  const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("codeToHtml.theme")) {
      resetHighlighter();
    }
  });

  context.subscriptions.push(cmd, configWatcher);
}

export function deactivate() {
  resetHighlighter();
}
