import React from "react";
import { useVideoConfig } from "remotion";

interface VignetteProps {
  intensity?: number;
  color?: string;
}

export const Vignette: React.FC<VignetteProps> = ({
  intensity = 0.5,
  color = "#000000",
}) => {
  const { width, height } = useVideoConfig();

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        background: `radial-gradient(ellipse at center, transparent 0%, transparent ${50 - intensity * 30}%, ${color} 100%)`,
        opacity: intensity,
      }}
    />
  );
};
