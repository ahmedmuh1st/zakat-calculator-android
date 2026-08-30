// Guards the one thing that has actually gone wrong twice: the version in the source, the
// version the binary declares, and the version the release notes describe drifting apart.
//
// The build platform assigns the version itself and bumped 1.0.4 to 1.0.5 during the 19 Aug
// build, which would have put 1.0.5 on Play carrying 1.0.4's release notes. A store listing
// that describes a different build than the one users install is worse than a wrong number:
// it makes the notes untrustworthy, and Ahmed's standing rule is that notes state what
// actually changed.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");
const read = (name: string) => readFileSync(join(root, name), "utf8");

function configVersion(): string {
  const match = read("app.config.ts").match(/^\s*version:\s*"(\d+\.\d+\.\d+)"/m);
  if (!match) throw new Error("no version found in app.config.ts");
  return match[1];
}

function configVersionCode(): number {
  const match = read("app.config.ts").match(/versionCode:\s*(\d+)/);
  if (!match) throw new Error("no versionCode found in app.config.ts");
  return Number(match[1]);
}

describe("version consistency", () => {
  it("has release notes for the version in app.config.ts", () => {
    const version = configVersion();
    expect(read("RELEASE-NOTES.md")).toContain(`## Android ${version}`);
  });

  it("has a Play-trimmed block for the version in app.config.ts", () => {
    // check_note_lengths.py reads this heading, so a missing one means the length check
    // silently measures nothing before an upload.
    const version = configVersion();
    expect(read("RELEASE-NOTES.md")).toContain(`### Play-trimmed ${version} wording`);
  });

  it("derives versionCode from the version the way the build platform does", () => {
    // The platform uses major*10000 + minor*100 + patch. Confirmed against two real binaries:
    // 1.0.2 on Play carries 10002, and the 19 Aug build of 1.0.5 carries 10005. Hand-numbering
    // this produced a sequence (3, 4, 5) that no binary ever used.
    const [major, minor, patch] = configVersion().split(".").map(Number);
    expect(configVersionCode()).toBe(major * 10000 + minor * 100 + patch);
  });

  it("keeps versionCode above the highest one already on Play", () => {
    // Play refuses a version code less than or equal to one already uploaded, and the
    // rejection arrives after the upload rather than before the build.
    const HIGHEST_ON_PLAY = 10002; // 1.0.2, live since Aug 2026
    expect(configVersionCode()).toBeGreaterThan(HIGHEST_ON_PLAY);
  });
});
