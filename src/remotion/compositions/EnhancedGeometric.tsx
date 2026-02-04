import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import {
  Noise,
  Scanlines,
  Particles,
  Vignette,
  GlitchLines,
  Dither,
} from "../components/effects";

interface Point {
  x: number;
  y: number;
}

interface EnhancedGeometricProps {
  backgroundColor: string;
  primaryColor: string;
  accentColor: string;
  shape: "hexagon" | "pentagon" | "octagon" | "triangle" | "circle";
  // Effects
  enableNoise: boolean;
  enableScanlines: boolean;
  enableParticles: boolean;
  enableVignette: boolean;
  enableGlitch: boolean;
  enableDither: boolean;
  ditherPattern: "bayer" | "halftone" | "lines" | "dots";
  // Randomization
  seed: number;
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const getPolygonPoints = (
  sides: number,
  radius: number,
  centerX: number,
  centerY: number,
  rotation: number = 0
): Point[] => {
  const points: Point[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + rotation;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return points;
};

const getSides = (shape: EnhancedGeometricProps["shape"]): number => {
  switch (shape) {
    case "triangle":
      return 3;
    case "pentagon":
      return 5;
    case "hexagon":
      return 6;
    case "octagon":
      return 8;
    case "circle":
      return 32;
    default:
      return 6;
  }
};

export const EnhancedGeometric: React.FC<EnhancedGeometricProps> = ({
  backgroundColor,
  primaryColor,
  accentColor,
  shape,
  enableNoise = true,
  enableScanlines = true,
  enableParticles = true,
  enableVignette = true,
  enableGlitch = false,
  enableDither = true,
  ditherPattern = "bayer",
  seed = 42,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.25;

  // Randomized parameters based on seed
  const randomRotationSpeed = 0.05 + seededRandom(seed) * 0.1;
  const randomPulseFreq = 1 + seededRandom(seed + 1) * 2;
  const randomGlowIntensity = 0.5 + seededRandom(seed + 2) * 0.5;

  // Animation phases
  const drawProgress = interpolate(frame, [0, fps * 2], [0, 1], {
    extrapolateRight: "clamp",
  });

  const rotation = frame * randomRotationSpeed;

  const pulseScale = interpolate(
    Math.sin((frame / fps) * Math.PI * randomPulseFreq),
    [-1, 1],
    [0.92, 1.08]
  );

  const breathe = interpolate(
    Math.sin((frame / fps) * Math.PI * 0.5),
    [-1, 1],
    [0.98, 1.02]
  );

  const sides = getSides(shape);
  const points = getPolygonPoints(
    sides,
    baseRadius * pulseScale * breathe,
    centerX,
    centerY,
    rotation * 0.3
  );

  // Create path for the polygon with smooth drawing
  const createPolygonPath = (pts: Point[], progress: number): string => {
    if (pts.length === 0) return "";
    const totalLength = pts.length;
    const visiblePoints = Math.floor(totalLength * progress) + 1;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < Math.min(visiblePoints, pts.length); i++) {
      path += ` L ${pts[i].x} ${pts[i].y}`;
    }
    if (progress >= 1) {
      path += " Z";
    }
    return path;
  };

  // Multiple concentric shapes
  const concentricShapes = useMemo(() => {
    const shapes = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      const scale = 0.4 + (i / count) * 0.8;
      const rotationOffset = (i * Math.PI) / count;
      const delay = i * 10;
      shapes.push({
        points: getPolygonPoints(
          sides,
          baseRadius * scale,
          centerX,
          centerY,
          rotation * (0.2 + i * 0.1) + rotationOffset
        ),
        opacity: interpolate(frame, [delay, delay + fps], [0, 0.3 - i * 0.05], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        strokeWidth: 1 + i * 0.5,
      });
    }
    return shapes;
  }, [sides, baseRadius, centerX, centerY, rotation, frame, fps]);

  // Animated dashed circle
  const circleRadius = baseRadius * 1.15;
  const dashOffset = interpolate(frame, [0, durationInFrames], [0, -1000]);

  // Grid with depth effect
  const gridOpacity = interpolate(frame, [0, fps], [0, 0.12], {
    extrapolateRight: "clamp",
  });

  // Glow intensity animation
  const glowIntensity = interpolate(
    Math.sin((frame / fps) * Math.PI * 3),
    [-1, 1],
    [0.4, 1]
  ) * randomGlowIntensity;

  // Floating geometric elements
  const floatingElements = useMemo(() => {
    const elements = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const distance = baseRadius * 1.8 + seededRandom(seed + i + 10) * 100;
      const size = 10 + seededRandom(seed + i + 20) * 20;
      const speed = 0.02 + seededRandom(seed + i + 30) * 0.03;
      elements.push({
        x: centerX + Math.cos(angle + frame * speed) * distance,
        y: centerY + Math.sin(angle + frame * speed) * distance,
        size,
        rotation: frame * (0.05 + seededRandom(seed + i + 40) * 0.1),
        opacity: 0.2 + seededRandom(seed + i + 50) * 0.3,
      });
    }
    return elements;
  }, [baseRadius, centerX, centerY, frame, seed]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
      }}
    >
      {/* Gradient background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at center, ${backgroundColor} 0%, ${backgroundColor}dd 50%, ${backgroundColor}99 100%)`,
        }}
      />

      {/* Animated gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "20%",
          width: "30%",
          height: "30%",
          background: `radial-gradient(circle, ${primaryColor}22 0%, transparent 70%)`,
          filter: "blur(60px)",
          transform: `translate(${Math.sin(frame * 0.02) * 50}px, ${Math.cos(frame * 0.02) * 50}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "20%",
          width: "25%",
          height: "25%",
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          filter: "blur(50px)",
          transform: `translate(${Math.cos(frame * 0.025) * 40}px, ${Math.sin(frame * 0.025) * 40}px)`,
        }}
      />

      {/* Main SVG */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Grid background with perspective */}
        <g opacity={gridOpacity}>
          {/* Vertical lines */}
          {Array.from({ length: 25 }).map((_, i) => {
            const x = (width / 24) * i;
            const distFromCenter = Math.abs(x - centerX) / (width / 2);
            const lineOpacity = 1 - distFromCenter * 0.5;
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={height}
                stroke={primaryColor}
                strokeOpacity={lineOpacity * gridOpacity}
                strokeWidth={i === 12 ? 2 : 1}
                strokeDasharray={i === 12 ? "none" : "4,8"}
              />
            );
          })}
          {/* Horizontal lines */}
          {Array.from({ length: 15 }).map((_, i) => {
            const y = (height / 14) * i;
            const distFromCenter = Math.abs(y - centerY) / (height / 2);
            const lineOpacity = 1 - distFromCenter * 0.5;
            return (
              <line
                key={`h-${i}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke={primaryColor}
                strokeOpacity={lineOpacity * gridOpacity}
                strokeWidth={i === 7 ? 2 : 1}
                strokeDasharray={i === 7 ? "none" : "4,8"}
              />
            );
          })}
        </g>

        {/* Floating geometric elements */}
        {floatingElements.map((el, i) => (
          <g key={`float-${i}`} transform={`rotate(${el.rotation}, ${el.x}, ${el.y})`}>
            <rect
              x={el.x - el.size / 2}
              y={el.y - el.size / 2}
              width={el.size}
              height={el.size}
              fill="none"
              stroke={primaryColor}
              strokeWidth={1}
              opacity={el.opacity}
              transform={`rotate(45, ${el.x}, ${el.y})`}
            />
          </g>
        ))}

        {/* Outer dashed circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={circleRadius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={2}
          strokeDasharray="12,8"
          strokeDashoffset={dashOffset}
          opacity={0.5}
        />

        {/* Secondary circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={circleRadius * 1.1}
          fill="none"
          stroke={accentColor}
          strokeWidth={1}
          strokeDasharray="4,12"
          strokeDashoffset={-dashOffset * 0.7}
          opacity={0.3}
        />

        {/* Concentric shapes */}
        {concentricShapes.map((shapeData, i) => (
          <path
            key={`concentric-${i}`}
            d={createPolygonPath(shapeData.points, 1)}
            fill="none"
            stroke={i % 2 === 0 ? primaryColor : accentColor}
            strokeWidth={shapeData.strokeWidth}
            strokeDasharray="8,4"
            opacity={shapeData.opacity}
          />
        ))}

        {/* Main polygon glow */}
        <path
          d={createPolygonPath(points, drawProgress)}
          fill="none"
          stroke={primaryColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3 * glowIntensity}
          filter="blur(8px)"
        />

        {/* Main polygon */}
        <path
          d={createPolygonPath(points, drawProgress)}
          fill="none"
          stroke={primaryColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertex points with enhanced glow */}
        {points.map((point, index) => {
          const vertexDelay = index * 5;
          const vertexOpacity = interpolate(
            frame,
            [vertexDelay, vertexDelay + fps / 2],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const vertexScale = spring({
            frame: Math.max(0, frame - vertexDelay),
            fps,
            config: { damping: 8, stiffness: 80 },
          });

          const pulse = 1 + Math.sin((frame + index * 10) * 0.15) * 0.2;

          return (
            <g key={index}>
              {/* Outer glow */}
              <circle
                cx={point.x}
                cy={point.y}
                r={20 * vertexScale * pulse * glowIntensity}
                fill={accentColor}
                opacity={vertexOpacity * 0.15}
              />
              {/* Inner glow */}
              <circle
                cx={point.x}
                cy={point.y}
                r={12 * vertexScale * pulse * glowIntensity}
                fill={accentColor}
                opacity={vertexOpacity * 0.3}
              />
              {/* Main vertex (diamond) */}
              <rect
                x={point.x - 6 * vertexScale}
                y={point.y - 6 * vertexScale}
                width={12 * vertexScale}
                height={12 * vertexScale}
                fill={accentColor}
                opacity={vertexOpacity}
                transform={`rotate(45, ${point.x}, ${point.y})`}
              />
              {/* Center highlight */}
              <circle
                cx={point.x}
                cy={point.y}
                r={3 * vertexScale}
                fill="#ffffff"
                opacity={vertexOpacity * 0.8}
              />
            </g>
          );
        })}

        {/* Connecting lines from center */}
        {points.map((point, index) => {
          const lineDelay = fps + index * 3;
          const lineProgress = interpolate(
            frame,
            [lineDelay, lineDelay + fps / 2],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const endX = centerX + (point.x - centerX) * lineProgress;
          const endY = centerY + (point.y - centerY) * lineProgress;

          return (
            <line
              key={`line-${index}`}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke={primaryColor}
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.4 * lineProgress}
            />
          );
        })}

        {/* Center point */}
        <circle
          cx={centerX}
          cy={centerY}
          r={6}
          fill={primaryColor}
          opacity={interpolate(frame, [fps * 1.5, fps * 2], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      </svg>

      {/* Effects layers */}
      {enableParticles && (
        <Particles count={30} color={primaryColor} minSize={1} maxSize={3} seed={seed} />
      )}
      {enableDither && <Dither pattern={ditherPattern} scale={4} opacity={0.1} color={primaryColor} />}
      {enableScanlines && <Scanlines opacity={0.08} spacing={3} animated={false} />}
      {enableNoise && <Noise opacity={0.04} animated={true} />}
      {enableGlitch && <GlitchLines intensity={0.4} color={accentColor} seed={seed} />}
      {enableVignette && <Vignette intensity={0.6} />}
    </AbsoluteFill>
  );
};
