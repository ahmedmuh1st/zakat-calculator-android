// Responsive layout tokens for phones, unfolded foldables and tablets.
//
// Widths follow Android's window size classes (dp):
//   compact  < 600   regular phone, folded Galaxy Z Fold (~317dp)
//   medium   600-839 unfolded Fold (~673dp), small tablets, large phone landscape
//   expanded >= 840  tablets, desktop web
//
// Content is capped so text lines and cards never stretch to uncomfortable
// widths on wide screens; the extra space becomes symmetric margin instead.
import { useWindowDimensions } from "react-native";

export type SizeClass = "compact" | "medium" | "expanded";

export interface LayoutInfo {
  /** Full window width in dp. */
  windowWidth: number;
  /** Full window height in dp. */
  windowHeight: number;
  /** Android window size class for the current width. */
  sizeClass: SizeClass;
  /** True for unfolded foldables and tablets (>= 600dp). */
  isWide: boolean;
  /** Max width the readable content column is allowed to occupy. */
  contentMaxWidth: number;
  /** Effective content width after capping (never exceeds the window). */
  contentWidth: number;
  /** Columns for the category grid. */
  gridColumns: number;
  /** Whether the summary can show two side-by-side columns. */
  twoColumnSummary: boolean;
  /**
   * True once the window is wide enough for a genuine two-pane layout: a
   * primary content pane plus a persistent side pane. An unfolded Fold in
   * portrait (~673dp) stays single column, since two panes there would be
   * cramped; Fold landscape and tablets qualify.
   */
  twoPane: boolean;
  /** Fixed width of the side pane when `twoPane` is true. */
  sidePaneWidth: number;
  /** Max width of the primary pane when `twoPane` is true. */
  primaryMaxWidth: number;
  /** Diameter for the Nisab hero ring. */
  heroRingSize: number;
  /**
   * Style for FlatList/ScrollView contentContainerStyle so long lists stay in a
   * readable centered column on wide screens without changing phone layout.
   */
  listContentStyle: { alignSelf: "center"; width: "100%"; maxWidth: number } | undefined;
}

export const CONTENT_MAX_WIDTH = 560;
export const WIDE_CONTENT_MAX_WIDTH = 840;
export const SIDE_PANE_WIDTH = 320;
/** Minimum window width before a side pane earns its place. */
export const TWO_PANE_MIN_WIDTH = 840;

export function useLayout(): LayoutInfo {
  const { width, height } = useWindowDimensions();

  const sizeClass: SizeClass = width >= 840 ? "expanded" : width >= 600 ? "medium" : "compact";
  const isWide = sizeClass !== "compact";
  const twoPane = width >= TWO_PANE_MIN_WIDTH;

  // On compact widths the content simply fills the screen. On wider screens we
  // cap it: a single readable column on medium, a wider two-column canvas on
  // expanded.
  const contentMaxWidth =
    sizeClass === "compact" ? width : sizeClass === "medium" ? CONTENT_MAX_WIDTH : WIDE_CONTENT_MAX_WIDTH;
  const contentWidth = Math.min(width, contentMaxWidth);

  // More columns once there is room, so cards keep a comfortable size instead
  // of stretching into wide rectangles.
  const gridColumns = sizeClass === "expanded" ? 4 : 3;

  // The hero ring is driven by height on compact screens (so the first row of
  // cards still peeks above the fold) and can grow on wide screens.
  const heroRingSize = isWide
    ? 148
    : height < 700
      ? 108
      : height < 850
        ? 120
        : 132;

  return {
    windowWidth: width,
    windowHeight: height,
    sizeClass,
    isWide,
    contentMaxWidth,
    contentWidth,
    gridColumns,
    twoColumnSummary: sizeClass === "expanded",
    twoPane,
    sidePaneWidth: SIDE_PANE_WIDTH,
    primaryMaxWidth: CONTENT_MAX_WIDTH,
    heroRingSize,
    listContentStyle: isWide
      ? { alignSelf: "center", width: "100%", maxWidth: contentMaxWidth }
      : undefined,
  };
}
