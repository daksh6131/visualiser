import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { Noise, Vignette } from "../components/effects";
import { getRainbowColor, RainbowConfig, defaultRainbowConfig } from "../utils/colors";

type FieldPattern = "waves" | "spiral" | "vortex" | "terrain" | "ripple" | "fabric";
type ColorMode = "single" | "rainbow";

interface WaveFieldProps {
  backgroundColor: string;
  lineColor: string;
  pattern: FieldPattern;
  lineCount: number;
  segmentsPerLine: number;
  amplitude: number;
  frequency: number;
  speed: number;
  perspective: number;
  rotationSpeed: number;
  enableNoise: boolean;
  enableVignette: boolean;
  seed: number;
  // Rainbow color support
  colorMode?: ColorMode;
  rainbowConfig?: RainbowConfig;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export const WaveField: React.FC<WaveFieldProps> = ({
  backgroundColor = "#000000",
  lineColor = "#ffffff",
  pattern = "waves",
  lineCount = 40,
  segmentsPerLine = 80,
  amplitude = 50,
  frequency = 3,
  speed = 1,
  perspective = 0.6,
  rotationSpeed = 0,
  enableNoise = true,
  enableVignette = true,
  seed = 42,
  colorMode = "single",
  rainbowConfig = defaultRainbowConfig,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const time = (frame / fps) * speed;
  const rotation = time * rotationSpeed;

  // Generate line field based on pattern
  const lines = useMemo(() => {
    const result: { points: { x: number; y: number }[]; opacity: number; index: number }[] = [];

    switch (pattern) {
      case "waves": {
        // Horizontal wave lines with perspective
        for (let i = 0; i < lineCount; i++) {
          const yBase = (i / lineCount) * height * 1.5 - height * 0.25;
          const zDepth = i / lineCount;
          const perspectiveScale = 1 - perspective * zDepth * 0.8;
          const points: { x: number; y: number }[] = [];

          for (let j = 0; j <= segmentsPerLine; j++) {
            const xNorm = j / segmentsPerLine;
            const x = xNorm * width;

            // Multiple wave layers
            const wave1 = Math.sin(xNorm * Math.PI * frequency + time * 2 + i * 0.1) * amplitude;
            const wave2 = Math.sin(xNorm * Math.PI * frequency * 2 + time * 3 - i * 0.15) * amplitude * 0.5;
            const wave3 = Math.sin(xNorm * Math.PI * frequency * 0.5 + time * 1.5 + i * 0.05) * amplitude * 0.3;

            const y = yBase + (wave1 + wave2 + wave3) * perspectiveScale;

            points.push({ x, y });
          }

          result.push({
            points,
            opacity: interpolate(zDepth, [0, 0.3, 1], [0.1, 0.6, 1]),
            index: i,
          });
        }
        break;
      }

      case "spiral": {
        // Concentric spiral lines
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.max(width, height) * 0.7;

        for (let i = 0; i < lineCount; i++) {
          const baseAngle = (i / lineCount) * Math.PI * 2;
          const points: { x: number; y: number }[] = [];

          for (let j = 0; j <= segmentsPerLine; j++) {
            const t = j / segmentsPerLine;
            const radius = t * maxRadius;
            const spiralTwist = t * Math.PI * frequency * 2;
            const waveOffset = Math.sin(t * Math.PI * frequency * 4 + time * 3) * amplitude * t;

            const angle = baseAngle + spiralTwist + time * 0.5 + rotation;
            const r = radius + waveOffset;

            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            points.push({ x, y });
          }

          result.push({
            points,
            opacity: 0.4 + seededRandom(seed + i) * 0.6,
            index: i,
          });
        }
        break;
      }

      case "vortex": {
        // Dashed concentric circles with rotation
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.max(width, height) * 0.6;

        for (let i = 0; i < lineCount; i++) {
          const radiusNorm = (i + 1) / lineCount;
          const baseRadius = radiusNorm * maxRadius;
          const points: { x: number; y: number }[] = [];

          // Rotation speed varies by radius
          const layerRotation = time * (1 + radiusNorm * 2) + rotation;

          for (let j = 0; j <= segmentsPerLine; j++) {
            const angleNorm = j / segmentsPerLine;
            const angle = angleNorm * Math.PI * 2 + layerRotation;

            // Wave distortion
            const waveR = Math.sin(angleNorm * Math.PI * frequency * 8 + time * 4 + i * 0.2) * amplitude * 0.3;
            const waveAngle = Math.sin(angleNorm * Math.PI * frequency * 4 + time * 2) * 0.1;

            const r = baseRadius + waveR;
            const finalAngle = angle + waveAngle;

            const x = centerX + Math.cos(finalAngle) * r;
            const y = centerY + Math.sin(finalAngle) * r;

            points.push({ x, y });
          }

          result.push({
            points,
            opacity: interpolate(radiusNorm, [0, 0.5, 1], [0.3, 0.8, 0.5]),
            index: i,
          });
        }
        break;
      }

      case "terrain": {
        // 3D terrain-like perspective lines
        for (let i = 0; i < lineCount; i++) {
          const zNorm = i / lineCount;
          const zDepth = Math.pow(zNorm, 1.5); // Non-linear depth
          const yBase = height * 0.3 + zDepth * height * 0.7;
          const perspectiveScale = 1 - zDepth * perspective;
          const xOffset = (1 - perspectiveScale) * width * 0.5;
          const points: { x: number; y: number }[] = [];

          for (let j = 0; j <= segmentsPerLine; j++) {
            const xNorm = j / segmentsPerLine;
            const xLocal = xNorm * width * perspectiveScale + xOffset;

            // Terrain noise
            const noise1 = Math.sin(xNorm * Math.PI * frequency * 2 + zNorm * 10 + time) * amplitude;
            const noise2 = Math.sin(xNorm * Math.PI * frequency * 5 + zNorm * 5 - time * 1.5) * amplitude * 0.4;
            const noise3 = Math.cos(xNorm * Math.PI * frequency + time * 0.5) * amplitude * 0.3 * (1 - zDepth);

            const yOffset = (noise1 + noise2 + noise3) * perspectiveScale;
            const y = yBase - yOffset;

            points.push({ x: xLocal, y });
          }

          result.push({
            points,
            opacity: interpolate(zDepth, [0, 0.5, 1], [1, 0.6, 0.2]),
            index: i,
          });
        }
        break;
      }

      case "ripple": {
        // Concentric ripples from center
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.max(width, height) * 0.8;

        for (let i = 0; i < lineCount; i++) {
          const baseRadius = ((i + time * 5) % lineCount) / lineCount * maxRadius;
          const points: { x: number; y: number }[] = [];

          for (let j = 0; j <= segmentsPerLine; j++) {
            const angleNorm = j / segmentsPerLine;
            const angle = angleNorm * Math.PI * 2;

            // Ripple distortion
            const distortion = Math.sin(angleNorm * Math.PI * frequency * 6 + time * 3 + baseRadius * 0.02) * amplitude * 0.5;
            const r = baseRadius + distortion;

            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            points.push({ x, y });
          }

          const fadeIn = interpolate(baseRadius, [0, maxRadius * 0.1], [0, 1], { extrapolateRight: "clamp" });
          const fadeOut = interpolate(baseRadius, [maxRadius * 0.7, maxRadius], [1, 0], { extrapolateLeft: "clamp" });

          result.push({
            points,
            opacity: fadeIn * fadeOut * 0.8,
            index: i,
          });
        }
        break;
      }

      case "fabric": {
        // Intersecting wave grids like fabric
        // Horizontal waves
        for (let i = 0; i < lineCount / 2; i++) {
          const yBase = (i / (lineCount / 2)) * height;
          const points: { x: number; y: number }[] = [];

          for (let j = 0; j <= segmentsPerLine; j++) {
            const xNorm = j / segmentsPerLine;
            const x = xNorm * width;

            const wave = Math.sin(xNorm * Math.PI * frequency * 2 + time * 2 + i * 0.3) * amplitude;
            const y = yBase + wave;

            points.push({ x, y });
          }

          result.push({ points, opacity: 0.6, index: i });
        }

        // Vertical waves
        for (let i = 0; i < lineCount / 2; i++) {
          const xBase = (i / (lineCount / 2)) * width;
          const points: { x: number; y: number }[] = [];

          for (let j = 0; j <= segmentsPerLine; j++) {
            const yNorm = j / segmentsPerLine;
            const y = yNorm * height;

            const wave = Math.sin(yNorm * Math.PI * frequency * 2 + time * 2 + i * 0.3) * amplitude;
            const x = xBase + wave;

            points.push({ x, y });
          }

          result.push({ points, opacity: 0.6, index: i + lineCount / 2 });
        }
        break;
      }
    }

    return result;
  }, [pattern, lineCount, segmentsPerLine, width, height, time, amplitude, frequency, perspective, rotation, seed]);

  // Create SVG path from points
  const createPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  // Dashed line pattern based on pattern type
  const getDashArray = (patternType: FieldPattern, index: number): string => {
    switch (patternType) {
      case "vortex":
        return `${4 + seededRandom(seed + index) * 8},${2 + seededRandom(seed + index + 100) * 6}`;
      case "spiral":
        return `${2 + index * 0.5},${3 + seededRandom(seed + index) * 4}`;
      case "ripple":
        return `${6},${4}`;
      default:
        return "none";
    }
  };

  // Get stroke color for a line
  const getStrokeColor = (lineIndex: number, totalLines: number): string => {
    if (colorMode === "rainbow") {
      return getRainbowColor(lineIndex, totalLines, rainbowConfig, frame, fps);
    }
    return lineColor;
  };

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {lines.map((line, i) => (
          <path
            key={i}
            d={createPath(line.points)}
            fill="none"
            stroke={getStrokeColor(line.index, lines.length)}
            strokeWidth={pattern === "terrain" ? 1.5 : 1}
            strokeLinecap="round"
            strokeDasharray={getDashArray(pattern, i)}
            opacity={line.opacity}
          />
        ))}
      </svg>

      {enableNoise && <Noise opacity={0.06} animated={true} />}
      {enableVignette && <Vignette intensity={0.5} />}
    </AbsoluteFill>
  );
};
