import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

interface Point {
  x: number;
  y: number;
}

interface GeometricAnimationProps {
  backgroundColor: string;
  primaryColor: string;
  accentColor: string;
  shape: "hexagon" | "pentagon" | "octagon" | "triangle" | "circle";
  showGrid: boolean;
}

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

const getSides = (shape: GeometricAnimationProps["shape"]): number => {
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

export const GeometricAnimation: React.FC<GeometricAnimationProps> = ({
  backgroundColor,
  primaryColor,
  accentColor,
  shape,
  showGrid,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.25;

  // Animation phases
  const drawProgress = interpolate(frame, [0, fps * 2], [0, 1], {
    extrapolateRight: "clamp",
  });

  const rotation = interpolate(frame, [0, durationInFrames], [0, Math.PI * 2], {
    extrapolateRight: "clamp",
  });

  const pulseScale = interpolate(
    Math.sin((frame / fps) * Math.PI * 2),
    [-1, 1],
    [0.95, 1.05]
  );

  const vertexPulse = spring({
    frame: frame % (fps * 2),
    fps,
    config: {
      damping: 10,
      stiffness: 100,
    },
  });

  const sides = getSides(shape);
  const points = getPolygonPoints(
    sides,
    baseRadius * pulseScale,
    centerX,
    centerY,
    rotation * 0.1
  );

  // Create path for the polygon
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

  // Animated dashed circle around the polygon
  const circleRadius = baseRadius * 1.1;
  const dashOffset = interpolate(frame, [0, durationInFrames], [0, -1000]);

  // Grid lines
  const gridOpacity = interpolate(frame, [0, fps], [0, 0.15], {
    extrapolateRight: "clamp",
  });

  // Vertex glow animation
  const glowIntensity = interpolate(
    Math.sin((frame / fps) * Math.PI * 3),
    [-1, 1],
    [0.5, 1]
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        overflow: "hidden",
      }}
    >
      {/* Grid background */}
      {showGrid && (
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Vertical grid lines */}
          {Array.from({ length: 20 }).map((_, i) => {
            const x = (width / 20) * i;
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={height}
                stroke={primaryColor}
                strokeOpacity={gridOpacity}
                strokeWidth={1}
                strokeDasharray="4,8"
              />
            );
          })}
          {/* Horizontal grid lines */}
          {Array.from({ length: 12 }).map((_, i) => {
            const y = (height / 12) * i;
            return (
              <line
                key={`h-${i}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke={primaryColor}
                strokeOpacity={gridOpacity}
                strokeWidth={1}
                strokeDasharray="4,8"
              />
            );
          })}
          {/* Center crosshair */}
          <line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={height}
            stroke={primaryColor}
            strokeOpacity={gridOpacity * 2}
            strokeWidth={1}
            strokeDasharray="8,4"
          />
          <line
            x1={0}
            y1={centerY}
            x2={width}
            y2={centerY}
            stroke={primaryColor}
            strokeOpacity={gridOpacity * 2}
            strokeWidth={1}
            strokeDasharray="8,4"
          />
        </svg>
      )}

      {/* Main geometric shape */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* Outer dashed circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={circleRadius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={2}
          strokeDasharray="8,8"
          strokeDashoffset={dashOffset}
          opacity={0.6}
        />

        {/* Polygon shape */}
        <path
          d={createPolygonPath(points, drawProgress)}
          fill="none"
          stroke={primaryColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertex points with glow */}
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
            config: {
              damping: 8,
              stiffness: 80,
            },
          });

          return (
            <g key={index}>
              {/* Glow effect */}
              <circle
                cx={point.x}
                cy={point.y}
                r={12 * vertexScale * glowIntensity}
                fill={accentColor}
                opacity={vertexOpacity * 0.3}
              />
              {/* Main vertex point */}
              <rect
                x={point.x - 6 * vertexScale}
                y={point.y - 6 * vertexScale}
                width={12 * vertexScale}
                height={12 * vertexScale}
                fill={accentColor}
                opacity={vertexOpacity}
                transform={`rotate(45, ${point.x}, ${point.y})`}
              />
            </g>
          );
        })}

        {/* Connecting lines from center to vertices */}
        {points.map((point, index) => {
          const lineDelay = fps + index * 3;
          const lineOpacity = interpolate(
            frame,
            [lineDelay, lineDelay + fps / 3],
            [0, 0.3],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <line
              key={`line-${index}`}
              x1={centerX}
              y1={centerY}
              x2={point.x}
              y2={point.y}
              stroke={primaryColor}
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={lineOpacity}
            />
          );
        })}

        {/* Inner rotating shape */}
        <g
          transform={`rotate(${rotation * 30}, ${centerX}, ${centerY})`}
          opacity={interpolate(frame, [fps, fps * 2], [0, 0.5], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        >
          <path
            d={createPolygonPath(
              getPolygonPoints(sides, baseRadius * 0.5, centerX, centerY, 0),
              1
            )}
            fill="none"
            stroke={accentColor}
            strokeWidth={1}
            strokeDasharray="4,8"
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
