import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("toggles", () => {
  const fixtureUri = vscode.Uri.file(
    path.resolve(__dirname, "../../fixtures/sample.ts"),
  );

  const configKeys = [
    "lineNumbers",
    "border",
    "wordWrap",
  ] as const;

  teardown(async () => {
    const config = vscode.workspace.getConfiguration("codeToHtml");
    for (const key of configKeys) {
      await config.update(key, undefined, vscode.ConfigurationTarget.Global);
    }
  });

  test("toggleLineNumbers — flips to true, HTML has table", async () => {
    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);

    await vscode.commands.executeCommand("codeToHtml.toggleLineNumbers");

    const config = vscode.workspace.getConfiguration("codeToHtml");
    assert.strictEqual(config.get("lineNumbers"), true);

    await vscode.commands.executeCommand("codeToHtml.copyAsHtml");
    const clip = await vscode.env.clipboard.readText();
    assert.ok(clip.includes("<table"), "missing <table for line numbers");
    assert.ok(clip.includes("<td"), "missing <td for line numbers");
  });

  test("toggleBorder — flips to true, HTML has border style", async () => {
    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);

    await vscode.commands.executeCommand("codeToHtml.toggleBorder");

    const config = vscode.workspace.getConfiguration("codeToHtml");
    assert.strictEqual(config.get("border"), true);

    await vscode.commands.executeCommand("codeToHtml.copyAsHtml");
    const clip = await vscode.env.clipboard.readText();
    assert.ok(
      clip.includes("border:1px solid"),
      "missing border:1px solid",
    );
  });

  test("toggleWordWrap — flips to false, HTML has no pre-wrap", async () => {
    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);

    await vscode.commands.executeCommand("codeToHtml.toggleWordWrap");

    const config = vscode.workspace.getConfiguration("codeToHtml");
    assert.strictEqual(config.get("wordWrap"), false);

    await vscode.commands.executeCommand("codeToHtml.copyAsHtml");
    const clip = await vscode.env.clipboard.readText();
    assert.ok(
      !clip.includes("pre-wrap"),
      "should not contain pre-wrap when word wrap is off",
    );
  });

  test("toggleLineNumbers x2 — returns to false", async () => {
    await vscode.commands.executeCommand("codeToHtml.toggleLineNumbers");
    await vscode.commands.executeCommand("codeToHtml.toggleLineNumbers");

    const config = vscode.workspace.getConfiguration("codeToHtml");
    assert.strictEqual(config.get("lineNumbers"), false);
  });
});
