import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main() {
  const extensionDevelopmentPath =
    process.env.EXTENSION_DEV_PATH ?? path.resolve(__dirname, "../..");
  const extensionTestsPath = path.resolve(__dirname, "./suite/index");
  const testWorkspace = path.resolve(__dirname, "../fixtures");
  const version = process.env.VSCODE_VERSION ?? "stable";

  await runTests({
    version,
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [testWorkspace, "--disable-extensions"],
  });
}

main().catch((err) => {
  console.error("Failed to run tests:", err);
  process.exit(1);
});
