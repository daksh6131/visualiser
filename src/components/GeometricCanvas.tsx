"use client";

import React, { useEffect, useRef, useCallback } from "react";

type Shape = "hexagon" | "triangle" | "square" | "circle" | "star" | "pentagon" | "octagon";
type MotionPattern = "float" | "orbital" | "bounce" | "wave" | "spiral" | "pulse";

interface GeometricCanvasProps {
  shape: Shape;
  shapeCount: number;
  motionPattern: MotionPattern;
  motionSpeed: number;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  enableNoise: boolean;
  enableVignette: boolean;
  seed: number;
  paused?: boolean;
}

// Seeded random
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const GeometricCanvas: React.FC<GeometricCanvasProps> = ({
  shape = "hexagon",
  shapeCount = 3,
  motionPattern = "float",
  motionSpeed = 1,
  primaryColor = "#fbbf24",
  accentColor = "#ec4899",
  backgroundColor = "#0a1628",
  enableNoise = true,
  enableVignette = true,
  seed = 42,
  paused = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const propsRef = useRef({
    shape, shapeCount, motionPattern, motionSpeed,
    primaryColor, accentColor, backgroundColor,
    enableNoise, enableVignette, seed,
  });

  useEffect(() => {
    propsRef.current = {
      shape, shapeCount, motionPattern, motionSpeed,
      primaryColor, accentColor, backgroundColor,
      enableNoise, enableVignette, seed,
    };
  }, [shape, shapeCount, motionPattern, motionSpeed, primaryColor, accentColor, backgroundColor, enableNoise, enableVignette, seed]);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, size: number, shapeType: Shape, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.beginPath();
    switch (shapeType) {
      case "circle":
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        break;
      case "triangle":
        for (let i = 0; i < 3; i++) {
          const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
          const px = Math.cos(angle) * size;
          const py = Math.sin(angle) * size;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case "square":
        ctx.rect(-size, -size, size * 2, size * 2);
        break;
      case "pentagon":
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const px = Math.cos(angle) * size;
          const py = Math.sin(angle) * size;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case "hexagon":
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const px = Math.cos(angle) * size;
          const py = Math.sin(angle) * size;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case "octagon":
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const px = Math.cos(angle) * size;
          const py = Math.sin(angle) * size;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
      case "star":
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? size : size * 0.5;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        break;
    }

    ctx.restore();
  }, []);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const props = propsRef.current;
    const elapsed = (time - startTimeRef.current) / 1000 * props.motionSpeed;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const minDim = Math.min(width, height);

    // Background
    ctx.fillStyle = props.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw shapes
    for (let i = 0; i < props.shapeCount; i++) {
      const shapeSeed = props.seed + i * 100;
      const baseSize = minDim * (0.1 + seededRandom(shapeSeed) * 0.15);

      let x: number, y: number, rotation: number, scale: number;

      switch (props.motionPattern) {
        case "float": {
          const offsetX = seededRandom(shapeSeed + 1) * 0.6 - 0.3;
          const offsetY = seededRandom(shapeSeed + 2) * 0.6 - 0.3;
          const floatX = Math.sin(elapsed * 0.5 + i * 1.5) * minDim * 0.1;
          const floatY = Math.cos(elapsed * 0.4 + i * 1.2) * minDim * 0.08;
          x = cx + offsetX * width + floatX;
          y = cy + offsetY * height + floatY;
          rotation = elapsed * 0.2 + i;
          scale = 1 + Math.sin(elapsed + i) * 0.1;
          break;
        }
        case "orbital": {
          const orbitRadius = minDim * (0.15 + i * 0.08);
          const orbitSpeed = 0.5 - i * 0.1;
          const angle = elapsed * orbitSpeed + (i * Math.PI * 2) / props.shapeCount;
          x = cx + Math.cos(angle) * orbitRadius;
          y = cy + Math.sin(angle) * orbitRadius;
          rotation = angle + Math.PI / 2;
          scale = 1;
          break;
        }
        case "bounce": {
          const bounceX = Math.sin(elapsed * 1.5 + i * 2) * width * 0.3;
          const bounceY = Math.abs(Math.sin(elapsed * 2 + i)) * height * 0.3;
          x = cx + bounceX;
          y = cy - bounceY + height * 0.15;
          rotation = elapsed * 0.5;
          scale = 1 + Math.abs(Math.sin(elapsed * 2 + i)) * 0.2;
          break;
        }
        case "wave": {
          const waveOffset = (i / props.shapeCount) * width * 0.8 - width * 0.4;
          const waveY = Math.sin(elapsed * 2 + i * 0.8) * height * 0.2;
          x = cx + waveOffset + Math.sin(elapsed * 0.5) * 50;
          y = cy + waveY;
          rotation = Math.sin(elapsed + i) * 0.5;
          scale = 1 + Math.sin(elapsed * 1.5 + i) * 0.15;
          break;
        }
        case "spiral": {
          const spiralAngle = elapsed * 0.5 + (i * Math.PI * 2) / props.shapeCount;
          const spiralRadius = minDim * 0.1 + (Math.sin(elapsed * 0.3) * 0.5 + 0.5) * minDim * 0.25;
          x = cx + Math.cos(spiralAngle) * spiralRadius * (1 + i * 0.2);
          y = cy + Math.sin(spiralAngle) * spiralRadius * (1 + i * 0.2);
          rotation = spiralAngle;
          scale = 0.8 + i * 0.1;
          break;
        }
        case "pulse": {
          const pulseOffset = seededRandom(shapeSeed + 3) * Math.PI * 2;
          const pulseScale = 1 + Math.sin(elapsed * 2 + pulseOffset) * 0.3;
          const pulseRadius = minDim * 0.2 * pulseScale;
          const pulseAngle = (i * Math.PI * 2) / props.shapeCount;
          x = cx + Math.cos(pulseAngle) * pulseRadius;
          y = cy + Math.sin(pulseAngle) * pulseRadius;
          rotation = elapsed * 0.3 + i;
          scale = pulseScale;
          break;
        }
        default:
          x = cx;
          y = cy;
          rotation = 0;
          scale = 1;
      }

      const finalSize = baseSize * scale;

      // Create gradient
      const gradient = ctx.createLinearGradient(
        x - finalSize, y - finalSize,
        x + finalSize, y + finalSize
      );
      gradient.addColorStop(0, props.primaryColor);
      gradient.addColorStop(1, props.accentColor);

      // Glow
      ctx.shadowColor = props.primaryColor;
      ctx.shadowBlur = 20;

      // Draw filled shape
      ctx.fillStyle = gradient;
      drawShape(ctx, x, y, finalSize, props.shape, rotation);
      ctx.fill();

      // Draw stroke
      ctx.strokeStyle = props.accentColor;
      ctx.lineWidth = 2;
      drawShape(ctx, x, y, finalSize, props.shape, rotation);
      ctx.stroke();

      ctx.shadowBlur = 0;
    }

    // Noise overlay
    if (props.enableNoise) {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 15;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    // Vignette
    if (props.enableVignette) {
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.7);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    animationRef.current = requestAnimationFrame(render);
  }, [drawShape]);

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

export default GeometricCanvas;
