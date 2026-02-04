"use client";

import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

type WavePattern = "waves" | "spiral" | "vortex" | "terrain" | "ripple" | "fabric";
type ColorMode = "rainbow" | "single";

interface WaveCanvasProps {
  pattern: WavePattern;
  lineCount: number;
  amplitude: number;
  frequency: number;
  speed: number;
  perspective: number;
  colorMode: ColorMode;
  lineColor: string;
  hueStart: number;
  hueEnd: number;
  saturation: number;
  lightness: number;
  paused?: boolean;
}

export interface WaveCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

export const WaveCanvas = forwardRef<WaveCanvasHandle, WaveCanvasProps>(({
  pattern = "waves",
  lineCount = 40,
  amplitude = 50,
  frequency = 3,
  speed = 1,
  perspective = 0.6,
  colorMode = "rainbow",
  lineColor = "#ffffff",
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
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const propsRef = useRef({
    pattern, lineCount, amplitude, frequency, speed, perspective,
    colorMode, lineColor, hueStart, hueEnd, saturation, lightness,
  });

  useEffect(() => {
    propsRef.current = {
      pattern, lineCount, amplitude, frequency, speed, perspective,
      colorMode, lineColor, hueStart, hueEnd, saturation, lightness,
    };
  }, [pattern, lineCount, amplitude, frequency, speed, perspective, colorMode, lineColor, hueStart, hueEnd, saturation, lightness]);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const props = propsRef.current;
    const elapsed = (time - startTimeRef.current) / 1000 * props.speed;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    // Clear
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const segments = 100;

    for (let i = 0; i < props.lineCount; i++) {
      const lineProgress = i / props.lineCount;

      // Color
      let color: string;
      if (props.colorMode === "rainbow") {
        const hueRange = props.hueEnd - props.hueStart;
        const hue = (props.hueStart + lineProgress * hueRange + elapsed * 30) % 360;
        color = `hsl(${hue}, ${props.saturation}%, ${props.lightness}%)`;
      } else {
        color = props.lineColor;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let j = 0; j <= segments; j++) {
        const segProgress = j / segments;
        let x: number, y: number;

        switch (props.pattern) {
          case "waves": {
            x = segProgress * width;
            const baseY = cy + (lineProgress - 0.5) * height * props.perspective;
            const wave = Math.sin(segProgress * Math.PI * props.frequency + elapsed * 2 + lineProgress * 5) * props.amplitude;
            const wave2 = Math.sin(segProgress * Math.PI * props.frequency * 2 + elapsed * 3) * props.amplitude * 0.3;
            y = baseY + wave + wave2;
            break;
          }
          case "spiral": {
            const angle = segProgress * Math.PI * 4 + elapsed + lineProgress * Math.PI * 2;
            const radius = 50 + lineProgress * Math.min(width, height) * 0.4;
            const wobble = Math.sin(segProgress * Math.PI * props.frequency + elapsed * 2) * props.amplitude * 0.5;
            x = cx + Math.cos(angle) * (radius + wobble);
            y = cy + Math.sin(angle) * (radius + wobble) * props.perspective;
            break;
          }
          case "vortex": {
            const vortexAngle = segProgress * Math.PI * 6 + elapsed * 2 + lineProgress * 0.5;
            const vortexRadius = (1 - segProgress) * Math.min(width, height) * 0.45 * (0.5 + lineProgress * 0.5);
            const twist = Math.sin(elapsed + lineProgress * 3) * props.amplitude * 0.02;
            x = cx + Math.cos(vortexAngle + twist) * vortexRadius;
            y = cy + Math.sin(vortexAngle + twist) * vortexRadius * props.perspective;
            break;
          }
          case "terrain": {
            x = segProgress * width;
            const terrainBase = height * 0.3 + lineProgress * height * 0.5 * props.perspective;
            const noise1 = Math.sin(segProgress * props.frequency * 2 + lineProgress * 2) * props.amplitude;
            const noise2 = Math.sin(segProgress * props.frequency * 5 + elapsed + lineProgress) * props.amplitude * 0.4;
            const noise3 = Math.sin(segProgress * props.frequency * 10 + elapsed * 2) * props.amplitude * 0.15;
            y = terrainBase + noise1 + noise2 + noise3;
            break;
          }
          case "ripple": {
            const rippleAngle = segProgress * Math.PI * 2;
            const baseRadius = 30 + lineProgress * Math.min(width, height) * 0.4;
            const ripple = Math.sin(lineProgress * 10 - elapsed * 3 + segProgress * props.frequency) * props.amplitude * 0.5;
            x = cx + Math.cos(rippleAngle) * (baseRadius + ripple);
            y = cy + Math.sin(rippleAngle) * (baseRadius + ripple) * props.perspective;
            break;
          }
          case "fabric": {
            x = segProgress * width;
            const fabricBase = cy + (lineProgress - 0.5) * height * props.perspective * 0.8;
            const fold1 = Math.sin(segProgress * props.frequency + elapsed + lineProgress * 3) * props.amplitude;
            const fold2 = Math.cos(segProgress * props.frequency * 1.5 + elapsed * 0.7) * props.amplitude * 0.5;
            const drape = Math.sin(lineProgress * Math.PI) * props.amplitude * 0.3;
            y = fabricBase + fold1 + fold2 + drape;
            break;
          }
          default:
            x = segProgress * width;
            y = cy;
        }

        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
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
});

WaveCanvas.displayName = "WaveCanvas";

export default WaveCanvas;
