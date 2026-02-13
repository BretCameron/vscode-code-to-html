import { describe, it, expect } from "vitest";
import { findThemeContribution } from "../theme-resolver.js";

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
});
