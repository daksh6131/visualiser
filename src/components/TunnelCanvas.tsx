"use client";

import React, { useEffect, useRef, useCallback } from "react";

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

export const TunnelCanvas: React.FC<TunnelCanvasProps> = ({
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

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

  const getShapePath = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, shapeType: TunnelShape) => {
    ctx.beginPath();
    switch (shapeType) {
      case "circle":
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        break;
      case "triangle":
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
          const x = cx + Math.cos(angle) * size;
          const y = cy + Math.sin(angle) * size;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      case "square":
        ctx.rect(cx - size, cy - size, size * 2, size * 2);
        break;
      case "hexagon":
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = cx + Math.cos(angle) * size;
          const y = cy + Math.sin(angle) * size;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      case "star":
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? size : size * 0.5;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
    }
  }, []);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const props = propsRef.current;
    const elapsed = (time - startTimeRef.current) / 1000;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const maxSize = Math.sqrt(cx * cx + cy * cy) * 1.5;

    // Clear
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    // Calculate animation offset
    const cycleTime = 2 / props.zoomSpeed;
    const progress = (elapsed % cycleTime) / cycleTime;
    const offset = props.zoomDirection === "in" ? progress : 1 - progress;

    // Draw layers
    for (let i = props.layerCount - 1; i >= 0; i--) {
      const layerProgress = (i + offset) / props.layerCount;
      const size = layerProgress * maxSize;

      if (size < 5) continue;

      // Color based on layer
      const hueRange = props.hueEnd - props.hueStart;
      const hue = (props.hueStart + (layerProgress * hueRange + elapsed * 50 * props.zoomSpeed) % 360) % 360;
      const color = `hsl(${hue}, ${props.saturation}%, ${props.lightness}%)`;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(elapsed * props.rotationSpeed + i * 0.05);
      ctx.translate(-cx, -cy);

      // Glow effect
      if (props.enableGlow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 * props.glowIntensity;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2 + (1 - layerProgress) * 3;

      if (props.pattern === "starburst") {
        // Draw rays
        const rayCount = props.shape === "triangle" ? 3 : props.shape === "square" ? 4 : props.shape === "hexagon" ? 6 : props.shape === "star" ? 5 : 8;
        for (let r = 0; r < rayCount; r++) {
          const angle = (r * 2 * Math.PI) / rayCount;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
          ctx.stroke();
        }
      }

      getShapePath(ctx, cx, cy, size, props.shape);
      ctx.stroke();

      ctx.restore();
    }

    animationRef.current = requestAnimationFrame(render);
  }, [getShapePath]);

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

    startTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  // Handle pause
  useEffect(() => {
    if (paused) {
      pausedTimeRef.current = performance.now();
      cancelAnimationFrame(animationRef.current);
    } else {
      if (pausedTimeRef.current > 0) {
        startTimeRef.current += performance.now() - pausedTimeRef.current;
      }
      animationRef.current = requestAnimationFrame(render);
    }
  }, [paused, render]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};

export default TunnelCanvas;
