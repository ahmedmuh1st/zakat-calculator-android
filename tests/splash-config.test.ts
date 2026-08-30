import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import appConfig from "../app.config";


describe("native splash configuration", () => {
  it("uses the dedicated transparent wheat mark on a full deep-green background", () => {
    const splash = appConfig.plugins?.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
    );

    expect(splash).toBeTruthy();
    if (!Array.isArray(splash)) return;

    const options = splash[1] as {
      image?: string;
      imageWidth?: number;
      backgroundColor?: string;
      dark?: { image?: string; backgroundColor?: string };
    };

    expect(options).toMatchObject({
      image: "./assets/images/splash-mark.png",
      imageWidth: 230,
      backgroundColor: "#015A51",
      dark: {
        image: "./assets/images/splash-mark.png",
        backgroundColor: "#015A51",
      },
    });
  });

  it("keeps a real alpha channel so no square can appear around the wheat", () => {
    const png = readFileSync("assets/images/splash-mark.png");

    // PNG IHDR byte 25 is the color type. Type 6 is truecolor with alpha.
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png[25]).toBe(6);
  });
});
