import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("multiFile", () => {
  const fixture1 = vscode.Uri.file(
    path.resolve(__dirname, "../../fixtures/sample.ts"),
  );
  const fixture2 = vscode.Uri.file(
    path.resolve(__dirname, "../../fixtures/sample2.py"),
  );

  teardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("copy 2 files — clipboard contains content from both", async () => {
    await vscode.commands.executeCommand(
      "codeToHtml.copyAsHtml",
      fixture1,
      [fixture1, fixture2],
    );

    const clip = await vscode.env.clipboard.readText();
    assert.ok(clip.includes("greeting"), 'missing "greeting" from sample.ts');
    assert.ok(clip.includes("greet"), 'missing "greet" from sample2.py');
  });

  test("copy 2 files — exactly 2 <pre blocks", async () => {
    await vscode.commands.executeCommand(
      "codeToHtml.copyAsHtml",
      fixture1,
      [fixture1, fixture2],
    );

    const clip = await vscode.env.clipboard.readText();
    const preCount = (clip.match(/<pre /g) || []).length;
    assert.strictEqual(preCount, 2, `expected 2 <pre blocks, got ${preCount}`);
  });

  test("preview 2 files — title contains file count", async () => {
    await vscode.commands.executeCommand(
      "codeToHtml.previewAsHtml",
      fixture1,
      [fixture1, fixture2],
    );

    await new Promise((r) => setTimeout(r, 2_000));

    const tab = vscode.window.tabGroups.all
      .flatMap((g) => g.tabs)
      .find((t) => t.label.includes("2 files"));

    assert.ok(tab, 'preview tab with "2 files" not found');
  });

  test("preview 1 file — title is exactly Code to HTML Preview", async () => {
    const doc = await vscode.workspace.openTextDocument(fixture1);
    await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand("codeToHtml.previewAsHtml");

    await new Promise((r) => setTimeout(r, 2_000));

    const tab = vscode.window.tabGroups.all
      .flatMap((g) => g.tabs)
      .find((t) => t.label === "Code to HTML Preview");

    assert.ok(tab, 'preview tab "Code to HTML Preview" not found');
  });
});
