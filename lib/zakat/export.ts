// CSV export of saved history — shared via the system share sheet (native) or download (web).
import { Platform, Share } from "react-native";

import type { SavedCalculation } from "@/lib/zakat/types";
import { historyToCsv } from "./export-format";

export { historyToCsv } from "./export-format";

export async function exportHistoryCsv(history: SavedCalculation[]): Promise<void> {
  const csv = historyToCsv(history);
  const filename = `zakat-history-${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === "web") {
    // Browser download
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
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

  // Native: write to cache and open the share sheet with the file.
  try {
    const FileSystem = await import("expo-file-system/legacy");
    const Sharing = await import("expo-sharing");
    const uri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, "\uFEFF" + csv, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: filename });
      return;
    }
  } catch {
    // fall through to text share
  }
  // Fallback: share raw CSV text.
  await Share.share({ message: csv, title: filename });
}
