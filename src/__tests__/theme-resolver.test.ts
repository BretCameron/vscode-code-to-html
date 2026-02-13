import { describe, it, expect } from "vitest";
import { findThemeContribution, parseThemeJson, mergeThemes } from "../theme-resolver.js";

describe("theme-resolver", () => {
  describe("findThemeContribution", () => {
    const fakeExtensions = [
      {
        extensionPath: "/ext/theme-one",
        packageJSON: {
          contributes: {
            themes: [
              { id: "One Dark Pro", label: "One Dark Pro", path: "./themes/OneDark-Pro.json" },
            ],
          },
        },
      },
      {
        extensionPath: "/ext/dracula",
        packageJSON: {
          contributes: {
            themes: [
              { label: "Dracula", path: "./theme/dracula.json" },
            ],
          },
        },
      },
      {
        extensionPath: "/ext/no-themes",
        packageJSON: { contributes: {} },
      },
    ];

    it("finds theme by id", () => {
      const result = findThemeContribution(fakeExtensions, "One Dark Pro");
      expect(result).toEqual({
        extensionPath: "/ext/theme-one",
        themePath: "/ext/theme-one/themes/OneDark-Pro.json",
      });
    });

    it("finds theme by label when id is missing", () => {
      const result = findThemeContribution(fakeExtensions, "Dracula");
      expect(result).toEqual({
        extensionPath: "/ext/dracula",
        themePath: "/ext/dracula/theme/dracula.json",
      });
    });

    it("returns undefined when theme not found", () => {
      expect(findThemeContribution(fakeExtensions, "Nonexistent")).toBeUndefined();
    });

    it("handles extensions with no contributes.themes", () => {
      expect(findThemeContribution(fakeExtensions, "anything")).toBeUndefined();
    });
  });

  describe("parseThemeJson", () => {
    it("parses valid JSON", () => {
      const result = parseThemeJson('{"name": "test", "colors": {}}');
      expect(result).toEqual({ name: "test", colors: {} });
    });

    it("parses JSONC with comments", () => {
      const jsonc = `{
        // This is a comment
        "name": "test",
        /* block comment */
        "colors": {}
      }`;
      const result = parseThemeJson(jsonc);
      expect(result.name).toBe("test");
    });

    it("handles trailing commas", () => {
      const result = parseThemeJson('{"name": "test", "tokenColors": [],}');
      expect(result.name).toBe("test");
    });
  });

  describe("mergeThemes", () => {
    it("child overrides parent colors", () => {
      const parent = { name: "parent", colors: { "editor.background": "#000" }, tokenColors: [] };
      const child = { name: "child", colors: { "editor.background": "#fff" } };
      const result = mergeThemes(parent, child);
      expect(result.name).toBe("child");
      expect(result.colors["editor.background"]).toBe("#fff");
    });

    it("merges tokenColors (parent first, child appended)", () => {
      const parent = { name: "parent", colors: {}, tokenColors: [{ scope: "comment", settings: { foreground: "#aaa" } }] };
      const child = { name: "child", tokenColors: [{ scope: "string", settings: { foreground: "#bbb" } }] };
      const result = mergeThemes(parent, child);
      expect(result.tokenColors).toHaveLength(2);
      expect(result.tokenColors[0].scope).toBe("comment");
      expect(result.tokenColors[1].scope).toBe("string");
    });

    it("child without tokenColors inherits parent's", () => {
      const parent = { name: "parent", colors: {}, tokenColors: [{ scope: "a", settings: {} }] };
      const child = { name: "child", colors: {} };
      const result = mergeThemes(parent, child);
      expect(result.tokenColors).toHaveLength(1);
    });
  });
});
