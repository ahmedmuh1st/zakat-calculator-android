// Circular progress ring showing net wealth vs Nisab threshold — the dashboard hero.
import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export function NisabRing({
  progress, // 0..1 (capped)
  size = 150,
  strokeWidth = 11,
  trackColor = "rgba(255,255,255,0.22)",
  fillColor = "#FFFFFF",
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  fillColor?: string;
  /**
   * Either plain children, or a function receiving the usable width inside the circle.
   * Callers that render text need the width to size it, and computing the same geometry
   * at the call site would let the two drift apart.
   */
  children?: React.ReactNode | ((innerWidth: number) => React.ReactNode);
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const capped = Math.min(Math.max(progress, 0), 1);
  // The widest box that actually fits inside the circle, not the ring's bounding square.
  // A square inscribed in a circle has side r*sqrt(2), so children wider than that are
  // drawn over the stroke or past it. Long currency strings were overflowing the ring for
  // exactly this reason: children were free to use the full width. The 4px inset keeps
  // text clear of the stroke itself rather than touching it.
  const innerWidth = Math.max(0, Math.floor(r * Math.SQRT2) - 4);
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - capped)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ width: innerWidth, alignItems: "center", justifyContent: "center" }}>
        {typeof children === "function" ? children(innerWidth) : children}
      </View>
    </View>
  );
}
