import * as vscode from "vscode";
import * as fs from "fs/promises";
import type { BundledTheme } from "shiki";
import { resetHighlighter } from "./highlighter.js";
import { buildHtml, type BuildOptions, type FileEntry } from "./html-builder.js";

export function activate(context: vscode.ExtensionContext) {
  const cmd = vscode.commands.registerCommand(
    "codeToHtml.copyAsHtml",
    async (uri: vscode.Uri, allUris: vscode.Uri[]) => {
      const uris = allUris?.length ? allUris : uri ? [uri] : [];
      if (uris.length === 0) {
        vscode.window.showWarningMessage("No files selected.");
        return;
      }

      const config = vscode.workspace.getConfiguration("codeToHtml");
      const theme = config.get<string>("theme", "github-dark") as BundledTheme;
      const lineNumbers = config.get<boolean>("lineNumbers", false);
      const showFilePath = config.get<BuildOptions["showFilePath"]>(
        "showFilePath",
        "filename"
      );

      const workspaceRoot =
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

      const files: FileEntry[] = [];
      const skipped: string[] = [];

      for (const u of uris) {
        try {
          const stat = await fs.stat(u.fsPath);
          if (!stat.isFile()) {
            skipped.push(u.fsPath);
            continue;
          }
          // Skip files > 1MB (likely binary)
          if (stat.size > 1_000_000) {
            skipped.push(u.fsPath);
            continue;
          }
          const buf = await fs.readFile(u.fsPath);
          // Simple binary detection: check for null bytes in first 8KB
          const sample = buf.subarray(0, 8192);
          if (sample.includes(0)) {
            skipped.push(u.fsPath);
            continue;
          }
          files.push({ absolutePath: u.fsPath, content: buf.toString("utf-8") });
        } catch {
          skipped.push(u.fsPath);
        }
      }

      if (files.length === 0) {
        vscode.window.showWarningMessage("No readable text files selected.");
        return;
      }

      try {
        const html = await buildHtml(files, {
          theme,
          lineNumbers,
          showFilePath,
          workspaceRoot,
        });
        await vscode.env.clipboard.writeText(html);

        let msg = `Copied ${files.length} file(s) as HTML`;
        if (skipped.length) {
          msg += ` (${skipped.length} skipped)`;
        }
        vscode.window.showInformationMessage(msg);
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
