import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

const bundlePath = resolve(__dirname, "../../dist/extension.js");

describe("bundled extension", () => {
  let bundle: string;

  beforeAll(() => {
    if (!existsSync(bundlePath)) {
      execSync("node esbuild.js", {
        cwd: resolve(__dirname, "../.."),
        stdio: "inherit",
      });
    }
    bundle = readFileSync(bundlePath, "utf-8");
  }, 30_000);

  it('contains no dynamic import("vscode") calls', () => {
    // Dynamic import() bypasses esbuild's external resolution and VS Code's
    // require interception, causing "Cannot find package 'vscode'" at runtime.
    // All vscode access must go through static `import * as vscode from "vscode"`,
    // which esbuild rewrites to require("vscode") in the CJS bundle.
    const matches = bundle.match(/import\(\s*["']vscode["']\s*\)/g) ?? [];
    expect(matches).toEqual([]);
  });

  it('uses require("vscode") for vscode access', () => {
    expect(bundle).toMatch(/require\(\s*["']vscode["']\s*\)/);
  });
});
