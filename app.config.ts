import type { ExpoConfig } from "expo/config";

const bundleId = process.env.EXPO_PUBLIC_BUNDLE_ID || "org.example.privatezakatcalculator";
const owner = process.env.EXPO_OWNER;
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

const config: ExpoConfig = {
  name: "Zakat Calculator",
  slug: "zakat-calculator",
  ...(owner ? { owner } : {}),
  version: "1.0.7",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "privatezakatcalculator",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: bundleId,
    buildNumber: "1",
    appStoreUrl: "https://apps.apple.com/app/id6796694376",
    entitlements: {
      "com.apple.developer.ubiquity-kvstore-identifier":
        "$(TeamIdentifierPrefix)$(CFBundleIdentifier)",
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: ["mailto"],
      CFBundleLocalizations: ["en", "ar", "id", "ur", "bn", "tr", "fr"],
      CFBundleDevelopmentRegion: "en",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: bundleId,
    versionCode: 10007,
    allowBackup: true,
    permissions: [],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-mark.png",
        imageWidth: 230,
        resizeMode: "contain",
        backgroundColor: "#015A51",
        dark: {
          image: "./assets/images/splash-mark.png",
          backgroundColor: "#015A51",
        },
      },
    ],
    [
      "expo-build-properties",
      { android: { buildArchs: ["armeabi-v7a", "arm64-v8a"], minSdkVersion: 24 } },
    ],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  ...(easProjectId ? { extra: { eas: { projectId: easProjectId } } } : {}),
};

export default config;
