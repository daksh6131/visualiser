import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface GlitchLine {
  y: number;
  height: number;
  offset: number;
  opacity: number;
}

interface GlitchLinesProps {
  intensity?: number;
  color?: string;
  seed?: number;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export const GlitchLines: React.FC<GlitchLinesProps> = ({
  intensity = 0.3,
  color = "#00ffff",
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Only show glitch every few frames
  const showGlitch = frame % 8 < 2;

  const lines = useMemo(() => {
    const result: GlitchLine[] = [];
    const glitchSeed = seed + Math.floor(frame / 8);
    const lineCount = 3 + Math.floor(seededRandom(glitchSeed) * 5);

    for (let i = 0; i < lineCount; i++) {
      const rand1 = seededRandom(glitchSeed + i * 1.1);
      const rand2 = seededRandom(glitchSeed + i * 2.2);
      const rand3 = seededRandom(glitchSeed + i * 3.3);
      const rand4 = seededRandom(glitchSeed + i * 4.4);

      result.push({
        y: rand1 * height,
        height: 2 + rand2 * 20,
        offset: (rand3 - 0.5) * 50 * intensity,
        opacity: 0.5 + rand4 * 0.5,
      });
    }
    return result;
  }, [frame, height, intensity, seed]);

  if (!showGlitch) return null;

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
      }}
    >
      {lines.map((line, index) => (
        <rect
          key={index}
          x={line.offset < 0 ? 0 : line.offset}
          y={line.y}
          width={width - Math.abs(line.offset)}
          height={line.height}
          fill={color}
          opacity={line.opacity * intensity}
        />
      ))}
    </svg>
  );
};
