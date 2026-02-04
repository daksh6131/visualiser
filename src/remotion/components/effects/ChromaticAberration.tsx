import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

interface ChromaticAberrationProps {
  intensity?: number;
  animated?: boolean;
}

export const ChromaticAberration: React.FC<ChromaticAberrationProps> = ({
  intensity = 3,
  animated = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const offset = animated
    ? intensity * (1 + Math.sin(frame * 0.05) * 0.5)
    : intensity;

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
      <defs>
        <filter id="chromatic">
          <feOffset in="SourceGraphic" dx={offset} dy="0" result="red">
            <animate
              attributeName="dx"
              values={`${offset};${-offset};${offset}`}
              dur="2s"
              repeatCount="indefinite"
            />
          </feOffset>
          <feOffset in="SourceGraphic" dx={-offset} dy="0" result="blue" />
          <feBlend in="red" in2="blue" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
};
