import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface ScanlinesProps {
  opacity?: number;
  spacing?: number;
  color?: string;
  animated?: boolean;
}

export const Scanlines: React.FC<ScanlinesProps> = ({
  opacity = 0.1,
  spacing = 4,
  color = "#000000",
  animated = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const offset = animated ? (frame % (spacing * 2)) : 0;

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
      }}
    >
      <defs>
        <pattern
          id="scanlines"
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(0, ${offset})`}
        >
          <line
            x1="0"
            y1="0"
            x2={spacing}
            y2="0"
            stroke={color}
            strokeWidth="1"
            opacity={opacity}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#scanlines)" />
    </svg>
  );
};
