// Subtle 8-pointed star (rub el hizb) geometric texture — used as ambient background, not decoration.
import React from "react";
import Svg, { G, Path } from "react-native-svg";

function StarPath({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  // 8-pointed star: two overlapping squares, one axis-aligned and one rotated 45°
  const square = (rot: number) => {
    const p: string[] = [];
    for (let i = 0; i < 4; i++) {
      const a = rot + Math.PI / 4 + (i * Math.PI) / 2;
      const rr = r / Math.cos(Math.PI / 4);
      p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
    }
    return `M${p.join("L")}Z`;
  };
  return (
    <>
      <Path d={square(0)} fill="none" stroke="currentColor" strokeWidth={1} />
      <Path d={square(Math.PI / 4)} fill="none" stroke="currentColor" strokeWidth={1} />
    </>
  );
}

export function StarPattern({
  width,
  height,
  color = "#FFFFFF",
  opacity = 0.08,
}: {
  width: number;
  height: number;
  color?: string;
  opacity?: number;
}) {
  const cell = 72;
  const stars: React.ReactNode[] = [];
  for (let y = 0; y <= height + cell; y += cell) {
    for (let x = 0; x <= width + cell; x += cell) {
      const offset = (Math.floor(y / cell) % 2) * (cell / 2);
      stars.push(<StarPath key={`${x}-${y}`} cx={x + offset} cy={y} r={22} />);
    }
  }
  return (
    <Svg
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0, opacity }}
      color={color}
      pointerEvents="none"
    >
      <G>{stars}</G>
    </Svg>
  );
}
