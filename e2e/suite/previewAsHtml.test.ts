import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("previewAsHtml", () => {
  const fixtureUri = vscode.Uri.file(
    path.resolve(__dirname, "../../fixtures/sample.ts"),
  );

  test("opens preview panel", async () => {
    const doc = await vscode.workspace.openTextDocument(fixtureUri);
    await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand("codeToHtml.previewAsHtml");

    // Wait briefly for panel to appear
    await new Promise((r) => setTimeout(r, 2_000));

    const tab = vscode.window.tabGroups.all
      .flatMap((g) => g.tabs)
      .find((t) => t.label === "Code to HTML Preview");

    assert.ok(tab, 'preview tab "Code to HTML Preview" not found');
  });
});
