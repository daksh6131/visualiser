import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

interface MeshGradientProps {
  colors: string[];
  speed?: number;
  blur?: number;
  opacity?: number;
}

export const MeshGradient: React.FC<MeshGradientProps> = ({
  colors,
  speed = 0.5,
  blur = 80,
  opacity = 0.6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const time = (frame / fps) * speed;

  // Generate blob positions that animate smoothly
  const blobs = colors.map((color, i) => {
    const phaseOffset = (i / colors.length) * Math.PI * 2;

    // Each blob moves in a unique circular/elliptical path
    const xRadius = 25 + (i % 3) * 10;
    const yRadius = 20 + ((i + 1) % 3) * 12;
    const xSpeed = 0.3 + (i % 2) * 0.2;
    const ySpeed = 0.4 + ((i + 1) % 2) * 0.15;

    const x = 50 + Math.cos(time * xSpeed + phaseOffset) * xRadius;
    const y = 50 + Math.sin(time * ySpeed + phaseOffset) * yRadius;

    // Blob size pulses gently
    const size = 35 + Math.sin(time * 1.5 + i * 2) * 10;

    return { color, x, y, size };
  });

  // Build multi-layer radial gradient CSS
  const gradientLayers = blobs
    .map(
      (blob) =>
        `radial-gradient(ellipse ${blob.size}% ${blob.size * 1.3}% at ${blob.x}% ${blob.y}%, ${blob.color} 0%, transparent 70%)`
    )
    .join(", ");

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: gradientLayers,
        filter: `blur(${blur}px)`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

export default MeshGradient;
