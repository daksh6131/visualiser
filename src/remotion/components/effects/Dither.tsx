import React from "react";
import { useVideoConfig } from "remotion";

interface DitherProps {
  pattern?: "bayer" | "halftone" | "lines" | "dots";
  scale?: number;
  opacity?: number;
  color?: string;
}

export const Dither: React.FC<DitherProps> = ({
  pattern = "bayer",
  scale = 4,
  opacity = 0.15,
  color = "#ffffff",
}) => {
  const { width, height } = useVideoConfig();

  const getPattern = () => {
    switch (pattern) {
      case "bayer":
        // 4x4 Bayer dithering pattern
        return (
          <pattern
            id="dither-pattern"
            width={scale * 4}
            height={scale * 4}
            patternUnits="userSpaceOnUse"
          >
            {/* Bayer matrix approximation */}
            <rect x={0} y={0} width={scale} height={scale} fill={color} opacity={0.0625} />
            <rect x={scale * 2} y={0} width={scale} height={scale} fill={color} opacity={0.5625} />
            <rect x={scale} y={scale} width={scale} height={scale} fill={color} opacity={0.1875} />
            <rect x={scale * 3} y={scale} width={scale} height={scale} fill={color} opacity={0.6875} />
            <rect x={0} y={scale * 2} width={scale} height={scale} fill={color} opacity={0.75} />
            <rect x={scale * 2} y={scale * 2} width={scale} height={scale} fill={color} opacity={0.25} />
            <rect x={scale} y={scale * 3} width={scale} height={scale} fill={color} opacity={0.875} />
            <rect x={scale * 3} y={scale * 3} width={scale} height={scale} fill={color} opacity={0.375} />
          </pattern>
        );

      case "halftone":
        return (
          <pattern
            id="dither-pattern"
            width={scale * 2}
            height={scale * 2}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={scale} cy={scale} r={scale * 0.4} fill={color} />
          </pattern>
        );

      case "lines":
        return (
          <pattern
            id="dither-pattern"
            width={scale}
            height={scale}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2={scale} y2="0" stroke={color} strokeWidth={1} />
          </pattern>
        );

      case "dots":
        return (
          <pattern
            id="dither-pattern"
            width={scale}
            height={scale}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={scale / 2} cy={scale / 2} r={1} fill={color} />
          </pattern>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        mixBlendMode: "overlay",
      }}
    >
      <defs>{getPattern()}</defs>
      <rect width="100%" height="100%" fill="url(#dither-pattern)" opacity={opacity} />
    </svg>
  );
};
