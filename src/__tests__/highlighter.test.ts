import { describe, it, expect, afterAll } from "vitest";
import { detectLanguage, highlightCode, resetHighlighter, THEMES, ALL_LANG_IDS } from "../highlighter.js";

afterAll(() => {
  resetHighlighter();
});

describe("highlighter", () => {
  describe("detectLanguage", () => {
    it("detects by file extension", () => {
      // Shiki uses short IDs: ts, py, rs, etc.
      expect(detectLanguage("/foo/bar.ts")).toBe("ts");
      expect(detectLanguage("/foo/bar.py")).toBe("py");
      expect(detectLanguage("/foo/bar.rs")).toBe("rs");
      expect(detectLanguage("/foo/bar.go")).toBe("go");
      expect(detectLanguage("/foo/bar.js")).toBe("js");
    });

    it("detects by basename when it matches a language id", () => {
      expect(detectLanguage("/foo/makefile")).toBe("makefile");
      expect(detectLanguage("/foo/Makefile")).toBe("makefile");
    });

    it("resolves extension aliases", () => {
      expect(detectLanguage("/foo/bar.htm")).toBe("html");
      expect(detectLanguage("/foo/bar.mjs")).toBe("javascript");
      expect(detectLanguage("/foo/bar.cjs")).toBe("javascript");
      expect(detectLanguage("/foo/bar.mts")).toBe("typescript");
      expect(detectLanguage("/foo/bar.cts")).toBe("typescript");
      expect(detectLanguage("/foo/bar.cxx")).toBe("cpp");
      expect(detectLanguage("/foo/bar.cc")).toBe("cpp");
      expect(detectLanguage("/foo/bar.hpp")).toBe("cpp");
      expect(detectLanguage("/foo/bar.h")).toBe("c");
      expect(detectLanguage("/foo/bar.svg")).toBe("xml");
    });

    it("returns plaintext for unknown extensions", () => {
      expect(detectLanguage("/foo/bar.xyz")).toBe("plaintext");
      expect(detectLanguage("/foo/bar")).toBe("plaintext");
    });

    it("is case-insensitive", () => {
      expect(detectLanguage("/foo/bar.TS")).toBe("ts");
      expect(detectLanguage("/foo/bar.PY")).toBe("py");
    });
  });

  describe("THEMES", () => {
    it("has all bundled themes", () => {
      expect(THEMES.length).toBeGreaterThanOrEqual(50);
      expect(THEMES).toContain("github-dark");
      expect(THEMES).toContain("dracula");
      expect(THEMES).toContain("nord");
    });
  });

  describe("ALL_LANG_IDS", () => {
    it("contains common languages", () => {
      expect(ALL_LANG_IDS).toContain("typescript");
      expect(ALL_LANG_IDS).toContain("python");
      expect(ALL_LANG_IDS).toContain("rust");
    });
  });

  describe("highlightCode", () => {
    it("highlights TypeScript code", async () => {
      const html = await highlightCode('const x = 1;', "typescript", "github-dark");
      expect(html).toContain("<pre");
      expect(html).toContain("<code");
      expect(html).toContain("const");
    });

    it("wraps plaintext with themed background", async () => {
      const html = await highlightCode("hello world", "plaintext", "github-dark");
      expect(html).toContain("background-color:");
      expect(html).toContain("hello world");
      expect(html).toContain('class="shiki"');
    });

    it("escapes HTML in plaintext", async () => {
      const html = await highlightCode("<script>alert('xss')</script>", "plaintext", "github-dark");
      expect(html).toContain("&lt;script&gt;");
      expect(html).not.toContain("<script>");
    });
  });
});
