import { describe, it, expect, afterAll } from "vitest";
import { buildHtml, escapeHtml, type FileEntry, type BuildOptions } from "../html-builder.js";
import { resetHighlighter } from "../highlighter.js";

afterAll(() => {
  resetHighlighter();
});

const defaultOptions: BuildOptions = {
  theme: "github-dark",
  lineNumbers: false,
  border: false,
  showFilePath: "filename",
};

describe("html-builder", () => {
  describe("escapeHtml", () => {
    it("escapes &, <, >", () => {
      expect(escapeHtml("a & b < c > d")).toBe("a &amp; b &lt; c &gt; d");
    });

    it("returns empty string for empty input", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("leaves clean text unchanged", () => {
      expect(escapeHtml("hello world")).toBe("hello world");
    });
  });

  describe("buildHtml", () => {
    it("wraps output in a div", async () => {
      const files: FileEntry[] = [{ absolutePath: "/foo/test.ts", content: "const x = 1;" }];
      const html = await buildHtml(files, defaultOptions);
      expect(html).toMatch(/^<div style="[^"]*max-width:100%/);
      expect(html).toMatch(/<\/div>$/);
    });

    it("shows file path header for single file when showFilePath != none", async () => {
      const files: FileEntry[] = [{ absolutePath: "/foo/test.ts", content: "x" }];
      const html = await buildHtml(files, { ...defaultOptions, showFilePath: "filename" });
      expect(html).toContain("<strong>test.ts</strong>");
    });

    it("hides file path header when showFilePath is none", async () => {
      const files: FileEntry[] = [{ absolutePath: "/foo/test.ts", content: "x" }];
      const html = await buildHtml(files, { ...defaultOptions, showFilePath: "none" });
      expect(html).not.toContain("<strong>");
    });

    it("shows relative path with workspaceRoot", async () => {
      const files: FileEntry[] = [{ absolutePath: "/workspace/src/test.ts", content: "x" }];
      const html = await buildHtml(files, { ...defaultOptions, showFilePath: "relative", workspaceRoot: "/workspace" });
      expect(html).toContain("src/test.ts");
    });

    it("shows absolute path", async () => {
      const files: FileEntry[] = [{ absolutePath: "/foo/bar/test.ts", content: "x" }];
      const html = await buildHtml(files, { ...defaultOptions, showFilePath: "absolute" });
      expect(html).toContain("/foo/bar/test.ts");
    });

    it("adds border when enabled", async () => {
      const files: FileEntry[] = [{ absolutePath: "/foo/test.ts", content: "const x = 1;" }];
      const html = await buildHtml(files, { ...defaultOptions, border: true });
      expect(html).toContain("border:1px solid");
      expect(html).toContain("border-radius:6px");
    });

    it("adds line numbers when enabled", async () => {
      const files: FileEntry[] = [{ absolutePath: "/foo/test.ts", content: "line1\nline2\nline3" }];
      const html = await buildHtml(files, { ...defaultOptions, lineNumbers: true });
      expect(html).toContain("<table");
      expect(html).toContain("<tr>");
      // Should have numbers 1, 2, 3
      expect(html).toMatch(/>1</);
      expect(html).toMatch(/>2</);
      expect(html).toMatch(/>3</);
    });

    it("respects startLine offset for line numbers", async () => {
      const files: FileEntry[] = [{ absolutePath: "/foo/test.ts", content: "line1\nline2", startLine: 10 }];
      const html = await buildHtml(files, { ...defaultOptions, lineNumbers: true });
      expect(html).toMatch(/>10</);
      expect(html).toMatch(/>11</);
      expect(html).not.toMatch(/>1<\//);
    });

    it("uses language override", async () => {
      const files: FileEntry[] = [{ absolutePath: "/foo/test.txt", content: "const x = 1;" }];
      // Without override, .txt → plaintext
      const plain = await buildHtml(files, defaultOptions);
      // With override to typescript
      const ts = await buildHtml(files, { ...defaultOptions, languageOverride: "typescript" });
      // TS highlighting should include span elements from shiki
      expect(ts).toContain("<span");
      // Both should be valid HTML
      expect(plain).toContain("<pre");
      expect(ts).toContain("<pre");
    });

    it("handles multiple files", async () => {
      const files: FileEntry[] = [
        { absolutePath: "/foo/a.ts", content: "const a = 1;" },
        { absolutePath: "/foo/b.ts", content: "const b = 2;" },
      ];
      const html = await buildHtml(files, { ...defaultOptions, showFilePath: "filename" });
      expect(html).toContain("a.ts");
      expect(html).toContain("b.ts");
    });
  });
});
