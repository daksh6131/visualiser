"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";

// Type definitions
type HeightPattern = "noise" | "radial" | "pyramid" | "waves" | "ripple" | "terrain";
type ColorMode = "single" | "rainbow" | "height" | "gradient";

interface IsometricCanvasProps {
  // Grid configuration
  gridSize?: number;
  cubeSize?: number;

  // Height animation
  heightPattern?: HeightPattern;
  heightScale?: number;
  speed?: number;
  noiseScale?: number;

  // Colors
  baseColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  backgroundColor?: string;

  // Face shading (brightness multipliers)
  topShade?: number;
  leftShade?: number;
  rightShade?: number;

  // Color modes
  colorMode?: ColorMode;
  hueStart?: number;
  hueEnd?: number;
  saturation?: number;
  lightness?: number;

  // Effects
  enableGlow?: boolean;
  glowIntensity?: number;

  // Rotation
  rotation?: number; // 0-360 degrees, rotates the view around the grid
  autoRotate?: boolean;
  autoRotateSpeed?: number;

  // Animation
  paused?: boolean;
  seed?: number;
}

export interface IsometricCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

// ============= Utility Functions =============

// Convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 51, g: 102, b: 255 };
};

// Apply shade to color (supports both hex and rgb() strings)
const shadeColor = (color: string, shade: number): string => {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

  // Check if it's an rgb() string
  const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return `rgb(${clamp(r * shade)}, ${clamp(g * shade)}, ${clamp(b * shade)})`;
  }

  // Otherwise treat as hex
  const { r, g, b } = hexToRgb(color);
  return `rgb(${clamp(r * shade)}, ${clamp(g * shade)}, ${clamp(b * shade)})`;
};

// HSL to RGB string
const hslToRgb = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
};

// ============= Noise Functions =============

// Simple hash-based noise
const noise2D = (x: number, y: number, seed: number): number => {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.12) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1;
};

// Smoothed noise with interpolation
const smoothNoise = (x: number, y: number, seed: number): number => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const sx = x - x0;
  const sy = y - y0;

  // Smoothstep interpolation
  const fx = sx * sx * (3 - 2 * sx);
  const fy = sy * sy * (3 - 2 * sy);

  const n00 = noise2D(x0, y0, seed);
  const n10 = noise2D(x1, y0, seed);
  const n01 = noise2D(x0, y1, seed);
  const n11 = noise2D(x1, y1, seed);

  const nx0 = n00 * (1 - fx) + n10 * fx;
  const nx1 = n01 * (1 - fx) + n11 * fx;

  return nx0 * (1 - fy) + nx1 * fy;
};

// Fractal Brownian Motion for smoother terrain
const fbm = (x: number, y: number, seed: number, octaves: number = 4): number => {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency, seed + i * 100);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
};

// ============= Height Pattern Functions =============

const getHeight = (
  gridX: number,
  gridY: number,
  gridSize: number,
  time: number,
  pattern: HeightPattern,
  heightScale: number,
  noiseScale: number,
  seed: number
): number => {
  const cx = (gridSize - 1) / 2;
  const cy = (gridSize - 1) / 2;
  const dx = gridX - cx;
  const dy = gridY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const normalizedDist = dist / maxDist;

  switch (pattern) {
    case "noise": {
      // Animated Perlin-like noise
      const noiseVal = fbm(
        gridX * noiseScale * 0.08 + time * 0.2,
        gridY * noiseScale * 0.08 + time * 0.15,
        seed
      );
      return (noiseVal * 0.5 + 0.5) * heightScale;
    }

    case "radial": {
      // Radial wave from center
      const wave = Math.sin(dist * 0.6 - time * 2) * 0.5 + 0.5;
      const falloff = 1 - normalizedDist * 0.3;
      return wave * falloff * heightScale;
    }

    case "pyramid": {
      // Pyramid with subtle animated wobble
      const pyramidHeight = Math.max(0, 1 - normalizedDist * 1.2);
      const wobble =
        Math.sin(time * 0.8 + gridX * 0.3) *
        Math.cos(time * 0.6 + gridY * 0.3) *
        0.08;
      return Math.max(0, pyramidHeight + wobble) * heightScale;
    }

    case "waves": {
      // Diagonal waves
      const wave1 = Math.sin((gridX + gridY) * 0.4 + time * 1.5);
      const wave2 = Math.sin((gridX - gridY) * 0.3 + time * 1.2) * 0.5;
      return ((wave1 + wave2) * 0.25 + 0.5) * heightScale;
    }

    case "ripple": {
      // Concentric ripples from center
      const ripple = Math.sin(dist * 1.2 - time * 2.5) * 0.5 + 0.5;
      const fade = Math.max(0, 1 - normalizedDist * 0.7);
      return ripple * fade * heightScale;
    }

    case "terrain": {
      // Multi-octave noise terrain with slow animation
      const terrain = fbm(gridX * 0.12, gridY * 0.12, seed, 5);
      const breathe = Math.sin(time * 0.3) * 0.05;
      return (terrain * 0.5 + 0.5 + breathe) * heightScale;
    }

    default:
      return 0.5 * heightScale;
  }
};

// ============= Color Functions =============

const getCubeColor = (
  gridX: number,
  gridY: number,
  height: number,
  maxHeight: number,
  time: number,
  colorMode: ColorMode,
  baseColor: string,
  hueStart: number,
  hueEnd: number,
  saturation: number,
  lightness: number,
  gridSize: number
): string => {
  switch (colorMode) {
    case "rainbow": {
      const hueRange = hueEnd - hueStart;
      const progress = (gridX + gridY) / (gridSize * 2);
      const hue = (hueStart + progress * hueRange + time * 15) % 360;
      return hslToRgb(hue < 0 ? hue + 360 : hue, saturation, lightness);
    }

    case "height": {
      const heightProgress = Math.min(1, height / maxHeight);
      const hue = hueStart + heightProgress * (hueEnd - hueStart);
      return hslToRgb(hue % 360, saturation, lightness);
    }

    case "gradient": {
      const gradProgress = (gridX + gridY) / (gridSize * 2);
      const hue = hueStart + gradProgress * (hueEnd - hueStart);
      return hslToRgb(hue % 360, saturation, lightness);
    }

    case "single":
    default:
      return baseColor;
  }
};

// ============= Drawing Functions =============

const drawCube = (
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tileWidth: number,
  tileHeight: number,
  cubeHeight: number,
  topColor: string,
  leftColor: string,
  rightColor: string,
  strokeColor: string,
  strokeWidth: number
) => {
  const hw = tileWidth / 2;
  const hh = tileHeight / 2;

  // Top face (diamond)
  ctx.beginPath();
  ctx.moveTo(screenX, screenY);
  ctx.lineTo(screenX + hw, screenY + hh);
  ctx.lineTo(screenX, screenY + tileHeight);
  ctx.lineTo(screenX - hw, screenY + hh);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();
  if (strokeWidth > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }

  // Left face (parallelogram)
  ctx.beginPath();
  ctx.moveTo(screenX - hw, screenY + hh);
  ctx.lineTo(screenX, screenY + tileHeight);
  ctx.lineTo(screenX, screenY + tileHeight + cubeHeight);
  ctx.lineTo(screenX - hw, screenY + hh + cubeHeight);
  ctx.closePath();
  ctx.fillStyle = leftColor;
  ctx.fill();
  if (strokeWidth > 0) {
    ctx.stroke();
  }

  // Right face (parallelogram)
  ctx.beginPath();
  ctx.moveTo(screenX, screenY + tileHeight);
  ctx.lineTo(screenX + hw, screenY + hh);
  ctx.lineTo(screenX + hw, screenY + hh + cubeHeight);
  ctx.lineTo(screenX, screenY + tileHeight + cubeHeight);
  ctx.closePath();
  ctx.fillStyle = rightColor;
  ctx.fill();
  if (strokeWidth > 0) {
    ctx.stroke();
  }
};

// ============= Main Component =============

export const IsometricCanvas = forwardRef<IsometricCanvasHandle, IsometricCanvasProps>(
  (props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(0);

    // Store props in ref to avoid stale closures
    const propsRef = useRef({
      gridSize: props.gridSize ?? 12,
      cubeSize: props.cubeSize ?? 30,
      heightPattern: props.heightPattern ?? "noise",
      heightScale: props.heightScale ?? 1.5,
      speed: props.speed ?? 0.8,
      noiseScale: props.noiseScale ?? 2,
      baseColor: props.baseColor ?? "#3366ff",
      strokeColor: props.strokeColor ?? "#6699ff",
      strokeWidth: props.strokeWidth ?? 1,
      backgroundColor: props.backgroundColor ?? "#0a1628",
      topShade: props.topShade ?? 1.2,
      leftShade: props.leftShade ?? 0.8,
      rightShade: props.rightShade ?? 0.5,
      colorMode: props.colorMode ?? "single",
      hueStart: props.hueStart ?? 0,
      hueEnd: props.hueEnd ?? 360,
      saturation: props.saturation ?? 80,
      lightness: props.lightness ?? 50,
      enableGlow: props.enableGlow ?? false,
      glowIntensity: props.glowIntensity ?? 1,
      rotation: props.rotation ?? 0,
      autoRotate: props.autoRotate ?? false,
      autoRotateSpeed: props.autoRotateSpeed ?? 0.3,
      paused: props.paused ?? false,
      seed: props.seed ?? 42,
    });

    // Update props ref when props change
    useEffect(() => {
      propsRef.current = {
        gridSize: props.gridSize ?? 12,
        cubeSize: props.cubeSize ?? 30,
        heightPattern: props.heightPattern ?? "noise",
        heightScale: props.heightScale ?? 1.5,
        speed: props.speed ?? 0.8,
        noiseScale: props.noiseScale ?? 2,
        baseColor: props.baseColor ?? "#3366ff",
        strokeColor: props.strokeColor ?? "#6699ff",
        strokeWidth: props.strokeWidth ?? 1,
        backgroundColor: props.backgroundColor ?? "#0a1628",
        topShade: props.topShade ?? 1.2,
        leftShade: props.leftShade ?? 0.8,
        rightShade: props.rightShade ?? 0.5,
        colorMode: props.colorMode ?? "single",
        hueStart: props.hueStart ?? 0,
        hueEnd: props.hueEnd ?? 360,
        saturation: props.saturation ?? 80,
        lightness: props.lightness ?? 50,
        enableGlow: props.enableGlow ?? false,
        glowIntensity: props.glowIntensity ?? 1,
        rotation: props.rotation ?? 0,
        autoRotate: props.autoRotate ?? false,
        autoRotateSpeed: props.autoRotateSpeed ?? 0.3,
        paused: props.paused ?? false,
        seed: props.seed ?? 42,
      };
    }, [props]);

    // Expose canvas ref
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    // Convert grid coordinates to screen coordinates
    const gridToScreen = useCallback(
      (
        gridX: number,
        gridY: number,
        height: number,
        tileWidth: number,
        tileHeight: number,
        originX: number,
        originY: number
      ): { x: number; y: number } => {
        const screenX = originX + (gridX - gridY) * (tileWidth / 2);
        const screenY = originY + (gridX + gridY) * (tileHeight / 2) - height;
        return { x: screenX, y: screenY };
      },
      []
    );

    // Main render function
    const render = useCallback(
      (time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const p = propsRef.current;
        const elapsed = ((time - startTimeRef.current) / 1000) * p.speed;

        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = p.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Calculate rotation angle around Z-axis (add auto-rotation if enabled)
        const rotationDeg = p.autoRotate
          ? (p.rotation + elapsed * p.autoRotateSpeed * 60) % 360
          : p.rotation;
        const rotationRad = (rotationDeg * Math.PI) / 180;
        const cosR = Math.cos(rotationRad);
        const sinR = Math.sin(rotationRad);

        // Calculate tile dimensions
        const tileWidth = p.cubeSize * 2;
        const tileHeight = p.cubeSize;

        // Calculate grid bounds for centering
        const maxCubeHeight = p.cubeSize * p.heightScale;

        // Center of screen
        const centerX = width / 2;
        const centerY = height / 2;

        // Grid center for rotation
        const gridCenter = (p.gridSize - 1) / 2;

        // Enable glow if configured
        if (p.enableGlow) {
          ctx.shadowColor = p.baseColor;
          ctx.shadowBlur = 8 * p.glowIntensity;
        } else {
          ctx.shadowBlur = 0;
        }

        // Rotated isometric projection function
        // Standard isometric: X-axis goes right-down, Y-axis goes left-down
        // We rotate these basis vectors around Z-axis
        const gridToScreenRotated = (
          gx: number,
          gy: number,
          cubeHeight: number
        ): { x: number; y: number } => {
          // Center grid coordinates
          const cx = gx - gridCenter;
          const cy = gy - gridCenter;

          // Standard isometric basis vectors (before rotation)
          // X-axis direction: (1, 0.5) normalized by tile size
          // Y-axis direction: (-1, 0.5) normalized by tile size
          const isoX_x = tileWidth / 2;
          const isoX_y = tileHeight / 2;
          const isoY_x = -tileWidth / 2;
          const isoY_y = tileHeight / 2;

          // Rotate the basis vectors around Z-axis
          const rotIsoX_x = isoX_x * cosR - isoX_y * sinR;
          const rotIsoX_y = isoX_x * sinR + isoX_y * cosR;
          const rotIsoY_x = isoY_x * cosR - isoY_y * sinR;
          const rotIsoY_y = isoY_x * sinR + isoY_y * cosR;

          // Apply rotated projection
          const screenX = centerX + cx * rotIsoX_x + cy * rotIsoY_x;
          const screenY = centerY + cx * rotIsoX_y + cy * rotIsoY_y - cubeHeight;

          return { x: screenX, y: screenY };
        };

        // Create array of cubes for depth sorting
        const cubes: Array<{
          gridX: number;
          gridY: number;
          sortKey: number;
        }> = [];

        for (let gridX = 0; gridX < p.gridSize; gridX++) {
          for (let gridY = 0; gridY < p.gridSize; gridY++) {
            // Center grid for rotation
            const cx = gridX - gridCenter;
            const cy = gridY - gridCenter;

            // Rotate grid position to determine draw order
            const rotX = cx * cosR - cy * sinR;
            const rotY = cx * sinR + cy * cosR;

            // Sort key: cubes further back (higher rotY + rotX in rotated space) draw first
            const sortKey = rotX + rotY;

            cubes.push({ gridX, gridY, sortKey });
          }
        }

        // Sort back to front
        cubes.sort((a, b) => a.sortKey - b.sortKey);

        // Draw cubes in sorted order
        for (const cube of cubes) {
          const { gridX, gridY } = cube;

          // Calculate height for this cube
          const normalizedHeight = getHeight(
            gridX,
            gridY,
            p.gridSize,
            elapsed,
            p.heightPattern as HeightPattern,
            p.heightScale,
            p.noiseScale,
            p.seed
          );
          const cubeHeightPx = normalizedHeight * p.cubeSize;

          // Get screen position using rotated isometric projection
          const { x: screenX, y: screenY } = gridToScreenRotated(
            gridX,
            gridY,
            cubeHeightPx
          );

          // Determine cube color
          const cubeColor = getCubeColor(
            gridX,
            gridY,
            normalizedHeight,
            p.heightScale,
            elapsed,
            p.colorMode as ColorMode,
            p.baseColor,
            p.hueStart,
            p.hueEnd,
            p.saturation,
            p.lightness,
            p.gridSize
          );

          // Calculate face colors with shading
          const topColor = shadeColor(cubeColor, p.topShade);
          const leftColor = shadeColor(cubeColor, p.leftShade);
          const rightColor = shadeColor(cubeColor, p.rightShade);

          // Draw the cube
          drawCube(
            ctx,
            screenX,
            screenY,
            tileWidth,
            tileHeight,
            cubeHeightPx,
            topColor,
            leftColor,
            rightColor,
            p.strokeColor,
            p.strokeWidth
          );
        }

        // Reset shadow
        ctx.shadowBlur = 0;

        animationRef.current = requestAnimationFrame(render);
      },
      [gridToScreen]
    );

    // Setup resize observer
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          const dpr = Math.min(window.devicePixelRatio, 2);
          canvas.width = width * dpr;
          canvas.height = height * dpr;
        }
      });

      resizeObserver.observe(canvas);
      return () => resizeObserver.disconnect();
    }, []);

    // Initialize canvas and start animation
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;

      startTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(render);

      return () => cancelAnimationFrame(animationRef.current);
    }, [render]);

    // Handle pause/resume
    useEffect(() => {
      if (props.paused) {
        pausedTimeRef.current = performance.now();
        cancelAnimationFrame(animationRef.current);
      } else {
        if (pausedTimeRef.current > 0) {
          startTimeRef.current += performance.now() - pausedTimeRef.current;
        }
        animationRef.current = requestAnimationFrame(render);
      }
    }, [props.paused, render]);

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    );
  }
);

IsometricCanvas.displayName = "IsometricCanvas";
