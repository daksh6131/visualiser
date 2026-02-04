import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface NoiseProps {
  opacity?: number;
  seed?: number;
  animated?: boolean;
  color?: string;
}

export const Noise: React.FC<NoiseProps> = ({
  opacity = 0.05,
  seed = 0,
  animated = true,
  color = "#ffffff",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Generate noise pattern using SVG filter
  const noiseSeed = animated ? seed + frame : seed;

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
      <defs>
        <filter id={`noise-${noiseSeed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            seed={noiseSeed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect
        width="100%"
        height="100%"
        filter={`url(#noise-${noiseSeed})`}
        opacity={opacity}
        fill={color}
      />
    </svg>
  );
};
