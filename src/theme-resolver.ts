import * as path from "path";
import { parse as parseJsonc } from "jsonc-parser";

interface ExtensionInfo {
  extensionPath: string;
  packageJSON: any;
}

interface ThemeContribution {
  extensionPath: string;
  themePath: string;
}

export function findThemeContribution(
  extensions: ReadonlyArray<ExtensionInfo>,
  themeId: string
): ThemeContribution | undefined {
  for (const ext of extensions) {
    const themes = ext.packageJSON?.contributes?.themes;
    if (!Array.isArray(themes)) continue;
    for (const t of themes) {
      if (t.id === themeId || t.label === themeId) {
        return {
          extensionPath: ext.extensionPath,
          themePath: path.join(ext.extensionPath, t.path),
        };
      }
    }
  }
  return undefined;
}

export function parseThemeJson(content: string): any {
  return parseJsonc(content);
}

export function mergeThemes(parent: any, child: any): any {
  return {
    ...parent,
    ...child,
    colors: { ...parent.colors, ...child.colors },
    tokenColors: [
      ...(parent.tokenColors ?? []),
      ...(child.tokenColors ?? []),
    ],
  };
}
