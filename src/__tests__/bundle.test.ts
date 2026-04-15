import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { execSync } from "child_process";
import { resolve, join } from "path";

const bundlePath = resolve(__dirname, "../../dist/extension.js");
const srcDir = resolve(__dirname, "..");

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "__tests__") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkTs(full));
    } else if (entry.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

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

describe("source", () => {
  it('contains no dynamic import("vscode") calls', () => {
    const offenders: string[] = [];
    const re = /import\(\s*["']vscode["']\s*\)/;
    for (const file of walkTs(srcDir)) {
      if (re.test(readFileSync(file, "utf-8"))) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
