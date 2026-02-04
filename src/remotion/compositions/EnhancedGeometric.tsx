import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
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

type ShapeType = "hexagon" | "pentagon" | "octagon" | "triangle" | "circle" | "square" | "star";
type MotionPattern = "orbital" | "bounce" | "wave" | "spiral" | "chaos" | "pulse" | "float";

interface EnhancedGeometricProps {
  backgroundColor: string;
  primaryColor: string;
  accentColor: string;
  shape: ShapeType;
  // Multi-shape support
  shapeCount: number;
  mixShapes: boolean;
  // Effects
  enableNoise: boolean;
  enableScanlines: boolean;
  enableParticles: boolean;
  enableVignette: boolean;
  enableGlitch: boolean;
  enableDither: boolean;
  ditherPattern: "bayer" | "halftone" | "lines" | "dots";
  // New effects
  enableBloom: boolean;
  enableChromaticAberration: boolean;
  enableMirror: boolean;
  enableTrails: boolean;
  // Motion
  motionPattern: MotionPattern;
  motionSpeed: number;
  motionIntensity: number;
  // Randomization
  seed: number;
}

// Seeded random number generator for consistent randomization
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const allShapes: ShapeType[] = ["hexagon", "pentagon", "octagon", "triangle", "circle", "square", "star"];

const getPolygonPoints = (
  shape: ShapeType,
  radius: number,
  centerX: number,
  centerY: number,
  rotation: number = 0
): Point[] => {
  const points: Point[] = [];

  let sides: number;
  switch (shape) {
    case "triangle": sides = 3; break;
    case "square": sides = 4; break;
    case "pentagon": sides = 5; break;
    case "hexagon": sides = 6; break;
    case "octagon": sides = 8; break;
    case "circle": sides = 32; break;
    case "star": sides = 10; break; // 5-pointed star
    default: sides = 6;
  }

  if (shape === "star") {
    // Create star shape with alternating inner/outer points
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + rotation;
      const r = i % 2 === 0 ? radius : radius * 0.4;
      points.push({
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      });
    }
  } else {
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + rotation;
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
  }

  return points;
};

// Motion pattern generators
const getMotionOffset = (
  pattern: MotionPattern,
  frame: number,
  index: number,
  speed: number,
  intensity: number,
  seed: number
): { x: number; y: number; rotation: number; scale: number } => {
  const t = frame * speed * 0.01;
  const rand = seededRandom(seed + index);
  const phase = rand * Math.PI * 2;

  switch (pattern) {
    case "orbital":
      return {
        x: Math.cos(t + phase) * intensity * 100,
        y: Math.sin(t + phase) * intensity * 100,
        rotation: t * 0.5,
        scale: 1 + Math.sin(t * 2) * 0.1 * intensity,
      };
    case "bounce":
      return {
        x: Math.sin(t * 2 + phase) * intensity * 80,
        y: Math.abs(Math.sin(t * 3 + phase)) * intensity * -120,
        rotation: Math.sin(t + phase) * 0.3 * intensity,
        scale: 1 + Math.abs(Math.sin(t * 3 + phase)) * 0.2 * intensity,
      };
    case "wave":
      return {
        x: Math.sin(t + index * 0.5) * intensity * 60,
        y: Math.cos(t * 1.5 + index * 0.3) * intensity * 40,
        rotation: Math.sin(t * 0.5 + phase) * 0.5 * intensity,
        scale: 1 + Math.sin(t + index) * 0.15 * intensity,
      };
    case "spiral":
      const spiralAngle = t + index * (Math.PI / 4);
      const spiralRadius = (1 + Math.sin(t * 0.5)) * intensity * 80;
      return {
        x: Math.cos(spiralAngle) * spiralRadius,
        y: Math.sin(spiralAngle) * spiralRadius,
        rotation: spiralAngle,
        scale: 1 + Math.sin(t * 2 + phase) * 0.2 * intensity,
      };
    case "chaos":
      return {
        x: (Math.sin(t * 2.1 + phase) + Math.sin(t * 3.7 + phase * 2)) * intensity * 50,
        y: (Math.cos(t * 1.9 + phase) + Math.cos(t * 4.3 + phase * 3)) * intensity * 50,
        rotation: t * (0.5 + rand * 0.5) * intensity,
        scale: 1 + (Math.sin(t * 2.5 + phase) + Math.sin(t * 3.1)) * 0.1 * intensity,
      };
    case "pulse":
      return {
        x: Math.sin(t * 0.5 + phase) * intensity * 30,
        y: Math.cos(t * 0.5 + phase) * intensity * 30,
        rotation: t * 0.2,
        scale: 1 + Math.sin(t * 3 + index) * 0.3 * intensity,
      };
    case "float":
    default:
      return {
        x: Math.sin(t * 0.8 + phase) * intensity * 40 + Math.sin(t * 1.2 + phase * 2) * 20,
        y: Math.cos(t * 0.6 + phase) * intensity * 40 + Math.cos(t * 1.4 + phase * 3) * 20,
        rotation: Math.sin(t * 0.3 + phase) * 0.3 * intensity,
        scale: 1 + Math.sin(t * 1.5 + phase) * 0.1 * intensity,
      };
  }
};

export const EnhancedGeometric: React.FC<EnhancedGeometricProps> = ({
  backgroundColor,
  primaryColor,
  accentColor,
  shape,
  shapeCount = 1,
  mixShapes = false,
  enableNoise = true,
  enableScanlines = true,
  enableParticles = true,
  enableVignette = true,
  enableGlitch = false,
  enableDither = true,
  ditherPattern = "bayer",
  enableBloom = true,
  enableChromaticAberration = false,
  enableMirror = false,
  enableTrails = false,
  motionPattern = "float",
  motionSpeed = 1,
  motionIntensity = 1,
  seed = 42,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.18;

  // Generate multiple shapes with their properties
  const shapes = useMemo(() => {
    const rng = new SeededRandom(seed);
    const result = [];
    const count = Math.min(shapeCount, 12); // Cap at 12 shapes

    for (let i = 0; i < count; i++) {
      const shapeType = mixShapes ? rng.choice(allShapes) : shape;
      const hueShift = rng.range(-30, 30);
      const baseX = centerX + rng.range(-200, 200) * (count > 1 ? 1 : 0);
      const baseY = centerY + rng.range(-100, 100) * (count > 1 ? 1 : 0);
      const sizeMultiplier = count > 1 ? rng.range(0.5, 1.2) : 1;
      const rotationOffset = rng.range(0, Math.PI * 2);
      const delay = i * 8; // Stagger animations

      result.push({
        id: i,
        shape: shapeType,
        baseX,
        baseY,
        sizeMultiplier,
        rotationOffset,
        hueShift,
        delay,
        zIndex: rng.range(0, 100),
      });
    }

    // Sort by z-index for proper layering
    return result.sort((a, b) => a.zIndex - b.zIndex);
  }, [seed, shapeCount, mixShapes, shape, centerX, centerY]);

  // Animation phases
  const drawProgress = interpolate(frame, [0, fps * 2], [0, 1], {
    extrapolateRight: "clamp",
  });

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

  // Grid with depth effect
  const gridOpacity = interpolate(frame, [0, fps], [0, 0.1], {
    extrapolateRight: "clamp",
  });

  // Animated dashed circle
  const dashOffset = interpolate(frame, [0, durationInFrames], [0, -1000]);

  // Floating geometric elements
  const floatingElements = useMemo(() => {
    const elements = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const distance = baseRadius * 2.5 + seededRandom(seed + i + 10) * 150;
      const size = 8 + seededRandom(seed + i + 20) * 25;
      const speed = 0.015 + seededRandom(seed + i + 30) * 0.025;
      const shapeRand = seededRandom(seed + i + 60);
      elements.push({
        x: centerX + Math.cos(angle + frame * speed) * distance,
        y: centerY + Math.sin(angle + frame * speed) * distance,
        size,
        rotation: frame * (0.03 + seededRandom(seed + i + 40) * 0.07),
        opacity: 0.15 + seededRandom(seed + i + 50) * 0.25,
        type: shapeRand < 0.33 ? "square" : shapeRand < 0.66 ? "circle" : "triangle",
      });
    }
    return elements;
  }, [baseRadius, centerX, centerY, frame, seed]);

  // Render a single shape with all its effects
  const renderShape = (shapeConfig: typeof shapes[0]) => {
    const { id, shape: shapeType, baseX, baseY, sizeMultiplier, rotationOffset, delay } = shapeConfig;

    const motion = getMotionOffset(motionPattern, frame, id, motionSpeed, motionIntensity, seed + id);
    const shapeProgress = interpolate(frame, [delay, delay + fps * 2], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const pulseScale = interpolate(
      Math.sin((frame / fps) * Math.PI * (1 + seededRandom(seed + id) * 1.5)),
      [-1, 1],
      [0.92, 1.08]
    );

    const currentX = baseX + motion.x;
    const currentY = baseY + motion.y;
    const currentRotation = rotationOffset + motion.rotation;
    const currentScale = motion.scale * pulseScale * sizeMultiplier;

    const points = getPolygonPoints(
      shapeType,
      baseRadius * currentScale,
      currentX,
      currentY,
      currentRotation
    );

    const glowIntensity = interpolate(
      Math.sin((frame / fps) * Math.PI * 2 + id),
      [-1, 1],
      [0.5, 1]
    );

    // Concentric shapes for this shape
    const concentricCount = 3;
    const concentricShapes = [];
    for (let i = 0; i < concentricCount; i++) {
      const scale = 0.5 + (i / concentricCount) * 0.6;
      const concentricRotation = currentRotation + (i * Math.PI) / concentricCount;
      const concentricDelay = delay + i * 8;
      concentricShapes.push({
        points: getPolygonPoints(
          shapeType,
          baseRadius * scale * currentScale,
          currentX,
          currentY,
          concentricRotation
        ),
        opacity: interpolate(frame, [concentricDelay, concentricDelay + fps], [0, 0.25 - i * 0.06], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        strokeWidth: 1 + i * 0.3,
      });
    }

    return (
      <g key={id}>
        {/* Trail effect */}
        {enableTrails && Array.from({ length: 5 }).map((_, trailIndex) => {
          const trailFrame = Math.max(0, frame - trailIndex * 3);
          const trailMotion = getMotionOffset(motionPattern, trailFrame, id, motionSpeed, motionIntensity, seed + id);
          const trailX = baseX + trailMotion.x;
          const trailY = baseY + trailMotion.y;
          const trailRotation = rotationOffset + trailMotion.rotation;
          const trailPoints = getPolygonPoints(
            shapeType,
            baseRadius * currentScale * 0.95,
            trailX,
            trailY,
            trailRotation
          );
          return (
            <path
              key={`trail-${id}-${trailIndex}`}
              d={createPolygonPath(trailPoints, 1)}
              fill="none"
              stroke={primaryColor}
              strokeWidth={1}
              opacity={0.1 - trailIndex * 0.02}
            />
          );
        })}

        {/* Concentric shapes */}
        {concentricShapes.map((cs, i) => (
          <path
            key={`concentric-${id}-${i}`}
            d={createPolygonPath(cs.points, 1)}
            fill="none"
            stroke={i % 2 === 0 ? primaryColor : accentColor}
            strokeWidth={cs.strokeWidth}
            strokeDasharray="6,4"
            opacity={cs.opacity}
          />
        ))}

        {/* Bloom glow */}
        {enableBloom && (
          <>
            <path
              d={createPolygonPath(points, shapeProgress)}
              fill="none"
              stroke={primaryColor}
              strokeWidth={20}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.1 * glowIntensity * shapeProgress}
              filter="blur(15px)"
            />
            <path
              d={createPolygonPath(points, shapeProgress)}
              fill="none"
              stroke={accentColor}
              strokeWidth={12}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.15 * glowIntensity * shapeProgress}
              filter="blur(8px)"
            />
          </>
        )}

        {/* Main shape glow */}
        <path
          d={createPolygonPath(points, shapeProgress)}
          fill="none"
          stroke={primaryColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3 * glowIntensity * shapeProgress}
          filter="blur(6px)"
        />

        {/* Main shape */}
        <path
          d={createPolygonPath(points, shapeProgress)}
          fill="none"
          stroke={primaryColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={shapeProgress}
        />

        {/* Chromatic aberration effect */}
        {enableChromaticAberration && shapeProgress > 0.5 && (
          <>
            <path
              d={createPolygonPath(points, shapeProgress)}
              fill="none"
              stroke="#ff0000"
              strokeWidth={2}
              opacity={0.3}
              transform={`translate(-3, 0)`}
              style={{ mixBlendMode: "screen" }}
            />
            <path
              d={createPolygonPath(points, shapeProgress)}
              fill="none"
              stroke="#00ff00"
              strokeWidth={2}
              opacity={0.3}
              style={{ mixBlendMode: "screen" }}
            />
            <path
              d={createPolygonPath(points, shapeProgress)}
              fill="none"
              stroke="#0000ff"
              strokeWidth={2}
              opacity={0.3}
              transform={`translate(3, 0)`}
              style={{ mixBlendMode: "screen" }}
            />
          </>
        )}

        {/* Vertex points */}
        {points.map((point, index) => {
          const vertexDelay = delay + index * 4;
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
            <g key={`vertex-${id}-${index}`}>
              {/* Outer glow */}
              <circle
                cx={point.x}
                cy={point.y}
                r={18 * vertexScale * pulse * glowIntensity}
                fill={accentColor}
                opacity={vertexOpacity * 0.12}
              />
              {/* Inner glow */}
              <circle
                cx={point.x}
                cy={point.y}
                r={10 * vertexScale * pulse * glowIntensity}
                fill={accentColor}
                opacity={vertexOpacity * 0.25}
              />
              {/* Main vertex (diamond) */}
              <rect
                x={point.x - 5 * vertexScale}
                y={point.y - 5 * vertexScale}
                width={10 * vertexScale}
                height={10 * vertexScale}
                fill={accentColor}
                opacity={vertexOpacity}
                transform={`rotate(45, ${point.x}, ${point.y})`}
              />
              {/* Center highlight */}
              <circle
                cx={point.x}
                cy={point.y}
                r={2.5 * vertexScale}
                fill="#ffffff"
                opacity={vertexOpacity * 0.8}
              />
            </g>
          );
        })}

        {/* Connecting lines from center */}
        {points.map((point, index) => {
          const lineDelay = delay + fps + index * 3;
          const lineProgress = interpolate(
            frame,
            [lineDelay, lineDelay + fps / 2],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const endX = currentX + (point.x - currentX) * lineProgress;
          const endY = currentY + (point.y - currentY) * lineProgress;

          return (
            <line
              key={`line-${id}-${index}`}
              x1={currentX}
              y1={currentY}
              x2={endX}
              y2={endY}
              stroke={primaryColor}
              strokeWidth={1}
              strokeDasharray="3,3"
              opacity={0.35 * lineProgress}
            />
          );
        })}

        {/* Center point */}
        <circle
          cx={currentX}
          cy={currentY}
          r={5}
          fill={primaryColor}
          opacity={interpolate(frame, [delay + fps * 1.5, delay + fps * 2], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      </g>
    );
  };

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
          top: "15%",
          left: "15%",
          width: "35%",
          height: "35%",
          background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
          filter: "blur(80px)",
          transform: `translate(${Math.sin(frame * 0.015) * 60}px, ${Math.cos(frame * 0.015) * 60}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "15%",
          width: "30%",
          height: "30%",
          background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
          filter: "blur(60px)",
          transform: `translate(${Math.cos(frame * 0.02) * 50}px, ${Math.sin(frame * 0.02) * 50}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "40%",
          height: "40%",
          background: `radial-gradient(circle, ${primaryColor}10 0%, transparent 60%)`,
          filter: "blur(100px)",
          transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame * 0.01) * 0.2})`,
        }}
      />

      {/* Main SVG */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Grid background */}
        <g opacity={gridOpacity}>
          {Array.from({ length: 25 }).map((_, i) => {
            const x = (width / 24) * i;
            const distFromCenter = Math.abs(x - centerX) / (width / 2);
            const lineOpacity = 1 - distFromCenter * 0.6;
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={height}
                stroke={primaryColor}
                strokeOpacity={lineOpacity * gridOpacity}
                strokeWidth={i === 12 ? 1.5 : 0.5}
                strokeDasharray={i === 12 ? "none" : "3,9"}
              />
            );
          })}
          {Array.from({ length: 15 }).map((_, i) => {
            const y = (height / 14) * i;
            const distFromCenter = Math.abs(y - centerY) / (height / 2);
            const lineOpacity = 1 - distFromCenter * 0.6;
            return (
              <line
                key={`h-${i}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke={primaryColor}
                strokeOpacity={lineOpacity * gridOpacity}
                strokeWidth={i === 7 ? 1.5 : 0.5}
                strokeDasharray={i === 7 ? "none" : "3,9"}
              />
            );
          })}
        </g>

        {/* Floating geometric elements */}
        {floatingElements.map((el, i) => (
          <g key={`float-${i}`} transform={`rotate(${el.rotation}, ${el.x}, ${el.y})`}>
            {el.type === "square" && (
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
            )}
            {el.type === "circle" && (
              <circle
                cx={el.x}
                cy={el.y}
                r={el.size / 2}
                fill="none"
                stroke={accentColor}
                strokeWidth={1}
                opacity={el.opacity}
              />
            )}
            {el.type === "triangle" && (
              <polygon
                points={`${el.x},${el.y - el.size / 2} ${el.x - el.size / 2},${el.y + el.size / 2} ${el.x + el.size / 2},${el.y + el.size / 2}`}
                fill="none"
                stroke={primaryColor}
                strokeWidth={1}
                opacity={el.opacity}
              />
            )}
          </g>
        ))}

        {/* Outer orbit circles */}
        <circle
          cx={centerX}
          cy={centerY}
          r={baseRadius * 2.2}
          fill="none"
          stroke={primaryColor}
          strokeWidth={1.5}
          strokeDasharray="10,6"
          strokeDashoffset={dashOffset}
          opacity={0.4}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={baseRadius * 2.5}
          fill="none"
          stroke={accentColor}
          strokeWidth={1}
          strokeDasharray="4,10"
          strokeDashoffset={-dashOffset * 0.6}
          opacity={0.25}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={baseRadius * 2.8}
          fill="none"
          stroke={primaryColor}
          strokeWidth={0.5}
          strokeDasharray="2,14"
          strokeDashoffset={dashOffset * 0.4}
          opacity={0.15}
        />

        {/* Mirror effect */}
        {enableMirror && (
          <g opacity={0.3} transform={`scale(-1, 1) translate(${-width}, 0)`}>
            {shapes.map(renderShape)}
          </g>
        )}

        {/* Main shapes */}
        {shapes.map(renderShape)}
      </svg>

      {/* Effects layers */}
      {enableParticles && (
        <Particles count={40} color={primaryColor} minSize={1} maxSize={4} seed={seed} />
      )}
      {enableDither && <Dither pattern={ditherPattern} scale={4} opacity={0.08} color={primaryColor} />}
      {enableScanlines && <Scanlines opacity={0.06} spacing={3} animated={false} />}
      {enableNoise && <Noise opacity={0.035} animated={true} />}
      {enableGlitch && <GlitchLines intensity={0.5} color={accentColor} seed={seed} />}
      {enableVignette && <Vignette intensity={0.65} />}
    </AbsoluteFill>
  );
};
