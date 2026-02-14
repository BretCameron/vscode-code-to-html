import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("copyAsHtml", () => {
  const fixtureUri = vscode.Uri.file(
    path.resolve(__dirname, "../../fixtures/sample.ts"),
  );

  test("full file — clipboard contains highlighted HTML", async () => {
    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand("codeToHtml.copyAsHtml");

    const clip = await vscode.env.clipboard.readText();
    assert.ok(clip.includes("<pre"), "missing <pre");
    assert.ok(clip.includes("<code"), "missing <code");
    assert.ok(clip.includes("<span"), "missing <span");
    assert.ok(clip.includes("background-color:"), "missing background-color");
    assert.ok(clip.includes("greeting"), 'missing "greeting"');
  });

  test("selection — clipboard contains only selected range", async () => {
    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    const editor = await vscode.window.showTextDocument(doc);

    // Select line 1 only (the greeting line)
    editor.selection = new vscode.Selection(0, 0, 0, Number.MAX_SAFE_INTEGER);
    await vscode.commands.executeCommand("codeToHtml.copyAsHtml");

    const clip = await vscode.env.clipboard.readText();
    assert.ok(clip.includes("greeting"), 'missing "greeting"');
    assert.ok(!clip.includes("console.log"), 'should not contain "console.log"');
  });
});
