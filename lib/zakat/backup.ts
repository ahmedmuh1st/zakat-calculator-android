// Backup IO: writes a file to the share sheet, reads one back from the file picker.
// The format rules live in backup-format.ts, which has no React Native imports so it
// can be unit tested; everything there is re-exported here for convenience.
//
// Nothing here uploads anything. The export hands a file to the system share sheet and
// the user decides where it goes; the import reads a file the user picks. The automatic
// half of backup is Android Auto Backup, configured in app.config.ts, and needs no code.
import { Platform, Share } from "react-native";

import {
  backupFilename,
  buildBackup,
  serializeBackup,
} from "./backup-format";
import type { AppSnapshot } from "./types";

export * from "./backup-format";

export async function exportBackup(state: AppSnapshot, appVersion: string): Promise<void> {
  const json = serializeBackup(buildBackup(state, appVersion, Platform.OS));
  const filename = backupFilename();

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  try {
    const FileSystem = await import("expo-file-system/legacy");
    const Sharing = await import("expo-sharing");
    const uri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/json",
        dialogTitle: filename,
      });
      return;
    }
  } catch {
    // fall through to a plain text share
  }
  await Share.share({ message: json, title: filename });
}

/**
 * Opens the system file picker and returns the file's text, or null if the user cancels.
 * Reading only: nothing is applied until the caller validates and the user confirms.
 */
export async function pickBackupFile(): Promise<string | null> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json,.json";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };
      input.click();
    });
  }
  const DocumentPicker = await import("expo-document-picker");
  const res = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "*/*"],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const FileSystem = await import("expo-file-system/legacy");
  return FileSystem.readAsStringAsync(res.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}
