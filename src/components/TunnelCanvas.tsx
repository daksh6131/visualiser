"use client";

import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

type TunnelShape = "circle" | "triangle" | "square" | "hexagon" | "star";
type TunnelPattern = "concentric" | "starburst";

interface TunnelCanvasProps {
  shape: TunnelShape;
  pattern: TunnelPattern;
  layerCount: number;
  zoomSpeed: number;
  zoomDirection: "in" | "out";
  rotationSpeed: number;
  enableGlow: boolean;
  glowIntensity: number;
  hueStart: number;
  hueEnd: number;
  saturation: number;
  lightness: number;
  paused?: boolean;
}

export interface TunnelCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

// Pre-calculate shape vertices for polygon shapes
const getShapeVertices = (sides: number, innerRadius?: number): [number, number][] => {
  const vertices: [number, number][] = [];
  const points = innerRadius ? sides * 2 : sides;
  for (let i = 0; i < points; i++) {
    const angle = (i * Math.PI * 2) / points - Math.PI / 2;
    const r = innerRadius && i % 2 === 1 ? innerRadius : 1;
    vertices.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }
  return vertices;
};

// Pre-computed shape data
const SHAPE_DATA: Record<TunnelShape, { vertices: [number, number][]; rayCount: number }> = {
  circle: { vertices: [], rayCount: 8 },
  triangle: { vertices: getShapeVertices(3), rayCount: 3 },
  square: { vertices: getShapeVertices(4), rayCount: 4 },
  hexagon: { vertices: getShapeVertices(6), rayCount: 6 },
  star: { vertices: getShapeVertices(5, 0.5), rayCount: 5 },
};

export const TunnelCanvas = forwardRef<TunnelCanvasHandle, TunnelCanvasProps>(({
  shape = "circle",
  pattern = "concentric",
  layerCount = 30,
  zoomSpeed = 1,
  zoomDirection = "in",
  rotationSpeed = 0.2,
  enableGlow = true,
  glowIntensity = 1,
  hueStart = 0,
  hueEnd = 360,
  saturation = 80,
  lightness = 60,
  paused = false,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const propsRef = useRef({
    shape, pattern, layerCount, zoomSpeed, zoomDirection,
    rotationSpeed, enableGlow, glowIntensity,
    hueStart, hueEnd, saturation, lightness,
  });

  useEffect(() => {
    propsRef.current = {
      shape, pattern, layerCount, zoomSpeed, zoomDirection,
      rotationSpeed, enableGlow, glowIntensity,
      hueStart, hueEnd, saturation, lightness,
    };
  }, [shape, pattern, layerCount, zoomSpeed, zoomDirection, rotationSpeed, enableGlow, glowIntensity, hueStart, hueEnd, saturation, lightness]);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Calculate delta time for smooth animation
    if (lastTimeRef.current === 0) lastTimeRef.current = time;
    const deltaTime = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    elapsedRef.current += deltaTime;

    const elapsed = elapsedRef.current;
    const props = propsRef.current;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const maxSize = Math.sqrt(cx * cx + cy * cy) * 1.2;

    // Clear with solid black
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Calculate animation offset - smooth continuous motion
    const speed = props.zoomSpeed * 0.5;
    const rawOffset = (elapsed * speed) % 1;
    const offset = props.zoomDirection === "in" ? rawOffset : 1 - rawOffset;

    const shapeData = SHAPE_DATA[props.shape];
    const hueRange = props.hueEnd - props.hueStart;

    // Base rotation that continuously changes
    const baseRotation = elapsed * props.rotationSpeed;

    // Disable glow for performance - use opacity instead for depth effect
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // Draw layers from back to front
    for (let i = props.layerCount - 1; i >= 0; i--) {
      const layerProgress = (i + offset) / props.layerCount;
      const size = layerProgress * maxSize;

      if (size < 2) continue;

      // Smooth hue cycling
      const hue = (props.hueStart + layerProgress * hueRange + elapsed * 30) % 360;

      // Opacity based on distance (closer = more opaque)
      const alpha = props.enableGlow
        ? Math.min(1, (1 - layerProgress * 0.5) * props.glowIntensity)
        : 1;

      const color = `hsla(${hue}, ${props.saturation}%, ${props.lightness}%, ${alpha})`;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, 2 + (1 - layerProgress) * 2);

      // Per-layer rotation for spiral effect
      const layerRotation = baseRotation + i * 0.03;
      const cos = Math.cos(layerRotation);
      const sin = Math.sin(layerRotation);

      ctx.beginPath();

      if (props.shape === "circle") {
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
      } else {
        // Draw polygon using pre-computed vertices
        const vertices = shapeData.vertices;
        for (let v = 0; v <= vertices.length; v++) {
          const [vx, vy] = vertices[v % vertices.length];
          // Apply rotation manually (faster than ctx.rotate)
          const rx = vx * cos - vy * sin;
          const ry = vx * sin + vy * cos;
          const x = cx + rx * size;
          const y = cy + ry * size;
          if (v === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Starburst rays
      if (props.pattern === "starburst") {
        const rayCount = shapeData.rayCount;
        ctx.beginPath();
        for (let r = 0; r < rayCount; r++) {
          const angle = (r * 2 * Math.PI) / rayCount + layerRotation;
          const rx = Math.cos(angle) * size;
          const ry = Math.sin(angle) * size;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + rx, cy + ry);
        }
        ctx.stroke();
      }
    }

    animationRef.current = requestAnimationFrame(render);
  }, []);

  // Handle resize
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

  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    lastTimeRef.current = 0;
    elapsedRef.current = 0;
    animationRef.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  // Handle pause
  useEffect(() => {
    if (paused) {
      cancelAnimationFrame(animationRef.current);
    } else {
      lastTimeRef.current = 0; // Reset to avoid jump
      animationRef.current = requestAnimationFrame(render);
    }
  }, [paused, render]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", backgroundColor: "#000" }}
    />
  );
});

TunnelCanvas.displayName = "TunnelCanvas";

export default TunnelCanvas;
