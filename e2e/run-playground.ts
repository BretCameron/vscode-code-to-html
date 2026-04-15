import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main() {
  await runTests({
    version: process.env.VSCODE_VERSION ?? "stable",
    extensionDevelopmentPath: path.resolve(__dirname, "../.."),
    extensionTestsPath: path.resolve(__dirname, "./playground"),
    launchArgs: [path.resolve(__dirname, "../fixtures"), "--disable-extensions"],
    timeout: 60_000,
  });
}

main().catch((err) => {
  console.error("Playground exited with error:", err);
  process.exit(1);
});
