// Guards against the class of defect that crashed the iOS build on 19 Aug 2026.
//
// `expo-document-picker` was installed at v57 against Expo SDK 54, which expects v14. The
// JavaScript half and the native half were then different libraries, and the app died the
// moment the Settings screen module loaded. Nothing caught it: typecheck passed, every test
// passed, and the build succeeded, because none of those load native code.
//
// Two rules follow, and these tests enforce both:
//   1. Every Expo package must sit on the major version this SDK expects.
//   2. Native modules in the backup layer are imported inside the functions that use them, so
//      a mismatch that slips through breaks one button rather than a whole screen.
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
};

/**
 * Major versions Expo SDK 54 ships with, for the native packages this app actually uses.
 * Taken from the SDK 54 bundled-versions list. A package appearing here with a different
 * major means the JS and native halves can disagree, which is a crash rather than a bug.
 */
const SDK54_MAJORS: Record<string, number> = {
  expo: 54,
  "expo-clipboard": 8,
  "expo-constants": 18,
  "expo-document-picker": 14,
  "expo-file-system": 19,
  "expo-font": 14,
  "expo-haptics": 15,
  "expo-image": 3,
  "expo-keep-awake": 15,
  "expo-linear-gradient": 15,
  "expo-linking": 8,
  "expo-router": 6,
  "expo-secure-store": 15,
  "expo-sharing": 14,
  "expo-splash-screen": 31,
  "expo-status-bar": 3,
  "expo-store-review": 9,
  "expo-symbols": 1,
  "expo-system-ui": 6,
  "expo-web-browser": 15,
};

function majorOf(range: string): number {
  const m = /(\d+)\./.exec(range.replace(/^[\^~>=<\s]+/, ""));
  return m ? Number(m[1]) : NaN;
}

describe("native dependency versions", () => {
  it("every Expo package sits on the major version SDK 54 expects", () => {
    const wrong: string[] = [];
    for (const [name, range] of Object.entries(pkg.dependencies)) {
      const expected = SDK54_MAJORS[name];
      if (expected === undefined) continue;
      const actual = majorOf(range);
      if (actual !== expected) {
        wrong.push(`${name}: have ${range}, SDK 54 expects major ${expected}`);
      }
    }
    expect(wrong, `run "npx expo install <package>" rather than the package manager`).toEqual([]);
  });

  it("declares every Expo package it imports, so the version is pinned rather than hoisted", () => {
    // expo-file-system was imported by the backup and CSV layers while absent from
    // package.json, resolving to whatever a transitive dependency happened to install.
    for (const name of ["expo-document-picker", "expo-file-system", "expo-sharing"]) {
      expect(pkg.dependencies[name], `${name} must be a declared dependency`).toBeDefined();
    }
  });
});

describe("backup layer native imports", () => {
  const source = readFileSync(join(root, "lib/zakat/backup.ts"), "utf8");

  it("loads native modules lazily, not at module scope", () => {
    // A module-scope import means a broken native package takes down every screen that
    // imports this file, including Settings. Inside the function, it breaks one button.
    const moduleScope = source
      .split("\n")
      .filter((line) => /^import\s/.test(line))
      .filter((line) => /expo-(document-picker|file-system|sharing)/.test(line));
    expect(moduleScope).toEqual([]);
  });

  it("still reaches those modules through dynamic import", () => {
    for (const name of ["expo-document-picker", "expo-file-system", "expo-sharing"]) {
      expect(source).toContain(`await import("${name}`);
    }
  });
});
