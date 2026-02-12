import * as vscode from "vscode";
import * as fs from "fs/promises";
import type { BundledTheme } from "shiki";
import { resetHighlighter, THEMES, ALL_LANG_IDS } from "./highlighter.js";
import { buildHtml, type BuildOptions, type FileEntry } from "./html-builder.js";
import { showPreview } from "./preview.js";

function readConfig(config: vscode.WorkspaceConfiguration): BuildOptions {
  return {
    theme: config.get<string>("theme", "github-dark") as BundledTheme,
    lineNumbers: config.get<boolean>("lineNumbers", false),
    border: config.get<boolean>("border", false),
    showFilePath: config.get<BuildOptions["showFilePath"]>("showFilePath", "filename"),
    languageOverride: config.get<string>("languageOverride", "auto"),
  };
}

async function copyFromEditor(
  config: vscode.WorkspaceConfiguration,
  workspaceRoot: string | undefined
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor.");
    return;
  }

  const options = { ...readConfig(config), workspaceRoot };

  const selection = editor.selection;
  const hasSelection = !selection.isEmpty;
  const content = hasSelection
    ? editor.document.getText(selection)
    : editor.document.getText();

  const filePath = editor.document.uri.fsPath;
  const startLine = hasSelection ? selection.start.line + 1 : undefined;
  const files: FileEntry[] = [{ absolutePath: filePath, content, startLine }];

  const html = await buildHtml(files, options);
  await vscode.env.clipboard.writeText(html);

  const what = hasSelection ? "selection" : "file";
  vscode.window.showInformationMessage(`Copied ${what} as HTML`);
}

async function copyFromExplorer(
  uris: vscode.Uri[],
  config: vscode.WorkspaceConfiguration,
  workspaceRoot: string | undefined
): Promise<void> {
  const options = { ...readConfig(config), workspaceRoot };

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

  const html = await buildHtml(files, options);
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

  const selectTheme = vscode.commands.registerCommand(
    "codeToHtml.selectTheme",
    async () => {
      const config = vscode.workspace.getConfiguration("codeToHtml");
      const current = config.get<string>("theme", "github-dark");
      const picked = await vscode.window.showQuickPick(
        THEMES.map((t) => ({ label: t, description: t === current ? "current" : undefined })),
        { placeHolder: "Select a syntax highlighting theme" }
      );
      if (picked) await config.update("theme", picked.label, vscode.ConfigurationTarget.Global);
    }
  );

  const toggleLineNumbers = vscode.commands.registerCommand(
    "codeToHtml.toggleLineNumbers",
    async () => {
      const config = vscode.workspace.getConfiguration("codeToHtml");
      const current = config.get<boolean>("lineNumbers", false);
      await config.update("lineNumbers", !current, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Line numbers ${!current ? "enabled" : "disabled"}`);
    }
  );

  const selectFilePath = vscode.commands.registerCommand(
    "codeToHtml.selectFilePath",
    async () => {
      const config = vscode.workspace.getConfiguration("codeToHtml");
      const current = config.get<string>("showFilePath", "filename");
      const options = ["filename", "relative", "absolute", "none"] as const;
      const picked = await vscode.window.showQuickPick(
        options.map((o) => ({ label: o, description: o === current ? "current" : undefined })),
        { placeHolder: "Select file path display mode" }
      );
      if (picked) await config.update("showFilePath", picked.label, vscode.ConfigurationTarget.Global);
    }
  );

  const toggleBorder = vscode.commands.registerCommand(
    "codeToHtml.toggleBorder",
    async () => {
      const config = vscode.workspace.getConfiguration("codeToHtml");
      const current = config.get<boolean>("border", false);
      await config.update("border", !current, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`Border ${!current ? "enabled" : "disabled"}`);
    }
  );

  const selectLanguage = vscode.commands.registerCommand(
    "codeToHtml.selectLanguage",
    async () => {
      const config = vscode.workspace.getConfiguration("codeToHtml");
      const current = config.get<string>("languageOverride", "auto");
      const items = [
        { label: "auto", description: current === "auto" ? "current" : undefined },
        ...ALL_LANG_IDS.map((l) => ({ label: l, description: l === current ? "current" : undefined })),
      ];
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: "Select language (auto = detect from file extension)",
      });
      if (picked) await config.update("languageOverride", picked.label, vscode.ConfigurationTarget.Global);
    }
  );

  const previewCmd = vscode.commands.registerCommand(
    "codeToHtml.previewAsHtml",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("No active editor.");
        return;
      }
      const config = vscode.workspace.getConfiguration("codeToHtml");
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const options = { ...readConfig(config), workspaceRoot };

      const selection = editor.selection;
      const hasSelection = !selection.isEmpty;
      const content = hasSelection
        ? editor.document.getText(selection)
        : editor.document.getText();

      const filePath = editor.document.uri.fsPath;
      const startLine = hasSelection ? selection.start.line + 1 : undefined;
      const files: FileEntry[] = [{ absolutePath: filePath, content, startLine }];

      try {
        const html = await buildHtml(files, options);
        showPreview(html);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`Code to HTML preview failed: ${errMsg}`);
      }
    }
  );

  context.subscriptions.push(cmd, selectTheme, toggleLineNumbers, toggleBorder, selectFilePath, selectLanguage, previewCmd);
}

export function deactivate() {
  resetHighlighter();
}
