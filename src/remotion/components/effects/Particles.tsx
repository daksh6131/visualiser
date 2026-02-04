import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
}

interface ParticlesProps {
  count?: number;
  color?: string;
  minSize?: number;
  maxSize?: number;
  direction?: "up" | "down" | "random";
  seed?: number;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export const Particles: React.FC<ParticlesProps> = ({
  count = 50,
  color = "#ffffff",
  minSize = 2,
  maxSize = 6,
  direction = "up",
  seed = 42,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const particles = useMemo(() => {
    const result: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const rand1 = seededRandom(seed + i * 1.1);
      const rand2 = seededRandom(seed + i * 2.2);
      const rand3 = seededRandom(seed + i * 3.3);
      const rand4 = seededRandom(seed + i * 4.4);
      const rand5 = seededRandom(seed + i * 5.5);

      result.push({
        x: rand1 * width,
        y: rand2 * height,
        size: minSize + rand3 * (maxSize - minSize),
        speed: 0.5 + rand4 * 2,
        opacity: 0.3 + rand5 * 0.7,
        delay: rand1 * 30,
      });
    }
    return result;
  }, [count, width, height, minSize, maxSize, seed]);

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
      {particles.map((particle, index) => {
        const progress = ((frame + particle.delay) * particle.speed) % height;
        let y: number;

        if (direction === "up") {
          y = height - progress;
        } else if (direction === "down") {
          y = progress;
        } else {
          y = particle.y + Math.sin((frame + particle.delay) * 0.05) * 50;
        }

        const x =
          particle.x + Math.sin((frame + particle.delay) * 0.02) * 20;

        const fadeIn = interpolate(frame, [particle.delay, particle.delay + 15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const pulseOpacity =
          particle.opacity *
          fadeIn *
          (0.7 + 0.3 * Math.sin((frame + index * 10) * 0.1));

        return (
          <g key={index}>
            {/* Glow */}
            <circle
              cx={x}
              cy={y}
              r={particle.size * 2}
              fill={color}
              opacity={pulseOpacity * 0.3}
            />
            {/* Main particle */}
            <circle
              cx={x}
              cy={y}
              r={particle.size}
              fill={color}
              opacity={pulseOpacity}
            />
          </g>
        );
      })}
    </svg>
  );
};
