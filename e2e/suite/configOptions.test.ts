import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("configOptions", () => {
  const fixtureUri = vscode.Uri.file(
    path.resolve(__dirname, "../../fixtures/sample.ts"),
  );

  const configKeys = [
    "theme",
    "lineNumbers",
    "border",
    "wordWrap",
    "showFilePath",
    "languageOverride",
  ] as const;

  teardown(async () => {
    const config = vscode.workspace.getConfiguration("codeToHtml");
    for (const key of configKeys) {
      await config.update(key, undefined, vscode.ConfigurationTarget.Global);
    }
  });

  async function copyHtml(): Promise<string> {
    await vscode.commands.executeCommand("codeToHtml.copyAsHtml");
    return vscode.env.clipboard.readText();
  }

  test("theme: github-light", async () => {
    const config = vscode.workspace.getConfiguration("codeToHtml");
    await config.update("theme", "github-light", vscode.ConfigurationTarget.Global);

    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);
    const clip = await copyHtml();

    assert.ok(clip.includes("background-color:"), "missing background-color");
  });

  test("theme: dracula", async () => {
    const config = vscode.workspace.getConfiguration("codeToHtml");
    await config.update("theme", "dracula", vscode.ConfigurationTarget.Global);

    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);
    const clip = await copyHtml();

    assert.ok(
      clip.toLowerCase().includes("#282a36"),
      "missing Dracula background #282A36",
    );
  });

  test("showFilePath: filename — contains sample.ts in <strong>", async () => {
    const config = vscode.workspace.getConfiguration("codeToHtml");
    await config.update("showFilePath", "filename", vscode.ConfigurationTarget.Global);

    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);
    const clip = await copyHtml();

    assert.ok(clip.includes("<strong"), "missing <strong> tag");
    assert.ok(clip.includes("sample.ts"), "missing sample.ts filename");
  });

  test("showFilePath: none — no <strong> tag", async () => {
    const config = vscode.workspace.getConfiguration("codeToHtml");
    await config.update("showFilePath", "none", vscode.ConfigurationTarget.Global);

    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);
    const clip = await copyHtml();

    assert.ok(!clip.includes("<strong"), "should not contain <strong> tag");
  });

  test("showFilePath: absolute — contains full path", async () => {
    const config = vscode.workspace.getConfiguration("codeToHtml");
    await config.update("showFilePath", "absolute", vscode.ConfigurationTarget.Global);

    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);
    const clip = await copyHtml();

    assert.ok(
      clip.includes("fixtures/sample.ts") || clip.includes("fixtures\\sample.ts"),
      "missing full path with fixtures/sample.ts",
    );
  });

  test("languageOverride: python — still produces valid HTML", async () => {
    const config = vscode.workspace.getConfiguration("codeToHtml");
    await config.update("languageOverride", "python", vscode.ConfigurationTarget.Global);

    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);
    const clip = await copyHtml();

    assert.ok(clip.includes("<pre"), "missing <pre");
    assert.ok(clip.includes("<span"), "missing <span");
  });

  test("combined: lineNumbers + border", async () => {
    const config = vscode.workspace.getConfiguration("codeToHtml");
    await config.update("lineNumbers", true, vscode.ConfigurationTarget.Global);
    await config.update("border", true, vscode.ConfigurationTarget.Global);

    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);
    const clip = await copyHtml();

    assert.ok(clip.includes("<table"), "missing <table for line numbers");
    assert.ok(clip.includes("border:1px solid"), "missing border:1px solid");
  });
});
