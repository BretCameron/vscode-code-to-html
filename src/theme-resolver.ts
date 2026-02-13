import * as path from "path";
import * as fs from "fs/promises";
import { parse as parseJsonc } from "jsonc-parser";
import type { ThemeRegistrationRaw } from "shiki";

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

export async function loadThemeFromFile(filePath: string): Promise<ThemeRegistrationRaw> {
  const content = await fs.readFile(filePath, "utf-8");
  const theme = parseThemeJson(content);

  if (theme.include) {
    const includePath = path.resolve(path.dirname(filePath), theme.include);
    const parent = await loadThemeFromFile(includePath);
    const { include: _, ...childWithoutInclude } = theme;
    return mergeThemes(parent, childWithoutInclude);
  }

  return theme;
}
