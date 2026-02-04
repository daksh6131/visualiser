import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { Noise, Vignette, MeshGradient } from "../components/effects";
import { getRainbowColor, RainbowConfig, defaultRainbowConfig, hslToString } from "../utils/colors";

type TunnelShape = "circle" | "triangle" | "square" | "hexagon" | "star" | "octagon";
type TunnelPattern = "concentric" | "starburst";
type ColorMode = "single" | "gradient" | "rainbow";

interface TunnelZoomProps {
  backgroundColor: string;
  primaryColor: string;
  pattern: TunnelPattern;
  shapeType: TunnelShape;
  layerCount: number;
  colorMode: ColorMode;
  rainbowConfig: RainbowConfig;
  gradientColors: string[];
  zoomSpeed: number;
  zoomDirection: "in" | "out";
  enableMeshGradient: boolean;
  meshColors: string[];
  enableGlow: boolean;
  glowIntensity: number;
  strokeWidth: number;
  enableNoise: boolean;
  enableVignette: boolean;
  rotationSpeed: number;
  seed: number;
}

// Get polygon points for a shape
const getPolygonPoints = (
  sides: number,
  radius: number,
  cx: number,
  cy: number,
  rotation: number = 0
): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + rotation;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return points;
};

// Get star points (alternating inner/outer radii)
const getStarPoints = (
  points: number,
  outerRadius: number,
  innerRadius: number,
  cx: number,
  cy: number,
  rotation: number = 0
): { x: number; y: number }[] => {
  const result: { x: number; y: number }[] = [];
  const totalPoints = points * 2;
  for (let i = 0; i < totalPoints; i++) {
    const angle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2 + rotation;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    result.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return result;
};

// Render a shape at given radius
const renderShape = (
  type: TunnelShape,
  radius: number,
  cx: number,
  cy: number,
  strokeColor: string,
  strokeWidth: number,
  rotation: number,
  opacity: number,
  key: string,
  filter?: string
): React.ReactElement => {
  const props = {
    fill: "none",
    stroke: strokeColor,
    strokeWidth,
    opacity,
    filter,
  };

  switch (type) {
    case "circle":
      return <circle key={key} cx={cx} cy={cy} r={radius} {...props} />;

    case "triangle": {
      const points = getPolygonPoints(3, radius, cx, cy, rotation);
      return (
        <polygon
          key={key}
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          {...props}
        />
      );
    }

    case "square": {
      const points = getPolygonPoints(4, radius, cx, cy, rotation + Math.PI / 4);
      return (
        <polygon
          key={key}
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          {...props}
        />
      );
    }

    case "hexagon": {
      const points = getPolygonPoints(6, radius, cx, cy, rotation);
      return (
        <polygon
          key={key}
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          {...props}
        />
      );
    }

    case "octagon": {
      const points = getPolygonPoints(8, radius, cx, cy, rotation);
      return (
        <polygon
          key={key}
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          {...props}
        />
      );
    }

    case "star": {
      const points = getStarPoints(5, radius, radius * 0.4, cx, cy, rotation);
      return (
        <polygon
          key={key}
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
          {...props}
        />
      );
    }

    default:
      return <circle key={key} cx={cx} cy={cy} r={radius} {...props} />;
  }
};

export const TunnelZoom: React.FC<TunnelZoomProps> = ({
  backgroundColor = "#000000",
  primaryColor = "#ffffff",
  pattern = "concentric",
  shapeType = "circle",
  layerCount = 30,
  colorMode = "rainbow",
  rainbowConfig = defaultRainbowConfig,
  gradientColors = ["#ff0066", "#6600ff", "#00ff66"],
  zoomSpeed = 1,
  zoomDirection = "in",
  enableMeshGradient = false,
  meshColors = ["#ff0066", "#6600ff", "#00ff66"],
  enableGlow = true,
  glowIntensity = 1,
  strokeWidth = 3,
  enableNoise = true,
  enableVignette = true,
  rotationSpeed = 0.2,
  seed = 42,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const time = frame / fps;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.max(width, height) * 0.8;
  const minRadius = 10;

  // Generate layers for concentric pattern
  const concentricLayers = useMemo(() => {
    if (pattern !== "concentric") return [];

    const layers = [];
    const logMin = Math.log(minRadius);
    const logMax = Math.log(maxRadius);

    for (let i = 0; i < layerCount; i++) {
      // Phase offset for staggered spawning
      const phaseOffset = i / layerCount;

      // Progress cycles continuously with time
      const rawProgress = (time * zoomSpeed * 0.5 + phaseOffset) % 1;

      // Direction: "in" means large -> small (towards center)
      const progress = zoomDirection === "in" ? 1 - rawProgress : rawProgress;

      // Logarithmic radius for even visual spacing
      const logRadius = logMin + progress * (logMax - logMin);
      const radius = Math.exp(logRadius);

      // Opacity fade at edges
      const fadeIn = interpolate(progress, [0, 0.1], [0, 1], { extrapolateRight: "clamp" });
      const fadeOut = interpolate(progress, [0.85, 1], [1, 0], { extrapolateLeft: "clamp" });
      const opacity = fadeIn * fadeOut;

      // Calculate color
      let strokeColor: string;
      if (colorMode === "rainbow") {
        strokeColor = getRainbowColor(i, layerCount, rainbowConfig, frame, fps);
      } else if (colorMode === "gradient" && gradientColors.length > 0) {
        // Use gradient colors based on depth
        const colorIndex = Math.floor(progress * (gradientColors.length - 1));
        strokeColor = gradientColors[Math.min(colorIndex, gradientColors.length - 1)];
      } else {
        strokeColor = primaryColor;
      }

      // Rotation per layer
      const rotation = time * rotationSpeed * (1 + (i % 5) * 0.1);

      layers.push({
        index: i,
        radius,
        opacity,
        strokeColor,
        rotation,
        progress,
      });
    }

    // Sort by radius (largest first for proper layering)
    return layers.sort((a, b) => b.radius - a.radius);
  }, [
    pattern, layerCount, time, zoomSpeed, zoomDirection, colorMode,
    rainbowConfig, gradientColors, primaryColor, frame, fps, rotationSpeed,
    minRadius, maxRadius
  ]);

  // Generate starburst beams
  const starburstBeams = useMemo(() => {
    if (pattern !== "starburst") return [];

    const beamCount = layerCount * 2; // More beams for density
    const segmentsPerBeam = 12;
    const beams: { x1: number; y1: number; x2: number; y2: number; opacity: number; color: string }[] = [];

    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 2;
      const angleJitter = Math.sin(i * 7.3 + time * 0.5) * 0.02;
      const finalAngle = angle + angleJitter;

      for (let j = 0; j < segmentsPerBeam; j++) {
        const baseDistance = j / segmentsPerBeam;
        const animatedDistance = (baseDistance + time * zoomSpeed * 0.4) % 1;

        // Exponential radius for acceleration feel
        const startR = minRadius + Math.pow(animatedDistance, 1.5) * (maxRadius - minRadius);
        const segmentLength = 15 + animatedDistance * 60;
        const endR = Math.min(startR + segmentLength, maxRadius);

        // Opacity fade
        const fadeIn = interpolate(animatedDistance, [0, 0.12], [0, 1], { extrapolateRight: "clamp" });
        const fadeOut = interpolate(animatedDistance, [0.75, 1], [1, 0], { extrapolateLeft: "clamp" });
        const opacity = fadeIn * fadeOut * 0.9;

        // Color
        let color: string;
        if (colorMode === "rainbow") {
          const hue = rainbowConfig.hueStart + (i / beamCount) * (rainbowConfig.hueEnd - rainbowConfig.hueStart);
          const animatedHue = rainbowConfig.animate
            ? (hue + time * rainbowConfig.speed * 60) % 360
            : hue;
          color = hslToString(animatedHue, rainbowConfig.saturation, rainbowConfig.lightness);
        } else if (colorMode === "gradient" && gradientColors.length > 0) {
          color = gradientColors[i % gradientColors.length];
        } else {
          color = primaryColor;
        }

        const x1 = centerX + Math.cos(finalAngle) * startR;
        const y1 = centerY + Math.sin(finalAngle) * startR;
        const x2 = centerX + Math.cos(finalAngle) * endR;
        const y2 = centerY + Math.sin(finalAngle) * endR;

        beams.push({ x1, y1, x2, y2, opacity, color });
      }
    }

    return beams;
  }, [
    pattern, layerCount, time, zoomSpeed, colorMode, rainbowConfig,
    gradientColors, primaryColor, centerX, centerY, minRadius, maxRadius
  ]);

  const glowFilterId = "tunnelGlow";

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      {/* Mesh gradient background */}
      {enableMeshGradient && (
        <MeshGradient colors={meshColors} speed={0.3} blur={100} opacity={0.5} />
      )}

      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          {/* Glow filter */}
          {enableGlow && (
            <filter
              id={glowFilterId}
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur
                stdDeviation={glowIntensity * 4}
                result="blur"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Concentric shapes pattern */}
        {pattern === "concentric" &&
          concentricLayers.map((layer) =>
            renderShape(
              shapeType,
              layer.radius,
              centerX,
              centerY,
              layer.strokeColor,
              strokeWidth,
              layer.rotation,
              layer.opacity,
              `layer-${layer.index}`,
              enableGlow ? `url(#${glowFilterId})` : undefined
            )
          )}

        {/* Starburst pattern */}
        {pattern === "starburst" &&
          starburstBeams.map((beam, i) => (
            <line
              key={`beam-${i}`}
              x1={beam.x1}
              y1={beam.y1}
              x2={beam.x2}
              y2={beam.y2}
              stroke={beam.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={beam.opacity}
              filter={enableGlow ? `url(#${glowFilterId})` : undefined}
            />
          ))}
      </svg>

      {/* Effect overlays */}
      {enableNoise && <Noise opacity={0.04} animated />}
      {enableVignette && <Vignette intensity={0.5} />}
    </AbsoluteFill>
  );
};

export default TunnelZoom;
