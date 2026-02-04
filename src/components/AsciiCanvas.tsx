"use client";

import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

type AsciiPattern = "donut" | "matrix" | "cube" | "sphere" | "plasma" | "tunnel" | "wave" | "spiral";
type ColorMode = "green" | "single" | "rainbow";

interface AsciiCanvasProps {
  pattern: AsciiPattern;
  speed: number;
  density: number;
  colorMode: ColorMode;
  textColor: string;
  hueStart: number;
  hueEnd: number;
  saturation: number;
  lightness: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  autoRotate: boolean;
  autoRotateSpeedX: number;
  autoRotateSpeedY: number;
  autoRotateSpeedZ: number;
  paused?: boolean;
}

export interface AsciiCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

const ASCII_CHARS = ".,-~:;=!*#$@";
const MATRIX_CHARS = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789";

export const AsciiCanvas = forwardRef<AsciiCanvasHandle, AsciiCanvasProps>(({
  pattern = "donut",
  speed = 1,
  density = 1,
  colorMode = "green",
  textColor = "#00ff00",
  hueStart = 0,
  hueEnd = 360,
  saturation = 80,
  lightness = 60,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  autoRotate = true,
  autoRotateSpeedX = 0.5,
  autoRotateSpeedY = 1,
  autoRotateSpeedZ = 0,
  paused = false,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const matrixDropsRef = useRef<number[]>([]);

  const propsRef = useRef({
    pattern, speed, density, colorMode, textColor,
    hueStart, hueEnd, saturation, lightness,
    rotationX, rotationY, rotationZ,
    autoRotate, autoRotateSpeedX, autoRotateSpeedY, autoRotateSpeedZ,
  });

  useEffect(() => {
    propsRef.current = {
      pattern, speed, density, colorMode, textColor,
      hueStart, hueEnd, saturation, lightness,
      rotationX, rotationY, rotationZ,
      autoRotate, autoRotateSpeedX, autoRotateSpeedY, autoRotateSpeedZ,
    };
  }, [pattern, speed, density, colorMode, textColor, hueStart, hueEnd, saturation, lightness, rotationX, rotationY, rotationZ, autoRotate, autoRotateSpeedX, autoRotateSpeedY, autoRotateSpeedZ]);

  const getColor = useCallback((value: number, props: typeof propsRef.current): string => {
    if (props.colorMode === "green") {
      const brightness = Math.floor(value * 255);
      return `rgb(0, ${brightness}, 0)`;
    } else if (props.colorMode === "rainbow") {
      const hueRange = props.hueEnd - props.hueStart;
      const hue = props.hueStart + value * hueRange;
      return `hsl(${hue}, ${props.saturation}%, ${props.lightness}%)`;
    } else {
      return props.textColor;
    }
  }, []);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const props = propsRef.current;
    const elapsed = (time - startTimeRef.current) / 1000 * props.speed;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, width, height);

    const fontSize = Math.max(8, Math.floor(14 * props.density));
    ctx.font = `${fontSize}px monospace`;

    const cols = Math.floor(width / (fontSize * 0.6));
    const rows = Math.floor(height / fontSize);

    // Calculate rotation
    let A = (props.rotationX * Math.PI) / 180;
    let B = (props.rotationY * Math.PI) / 180;
    let C = (props.rotationZ * Math.PI) / 180;

    if (props.autoRotate) {
      A += elapsed * props.autoRotateSpeedX;
      B += elapsed * props.autoRotateSpeedY;
      C += elapsed * props.autoRotateSpeedZ;
    }

    const cosA = Math.cos(A), sinA = Math.sin(A);
    const cosB = Math.cos(B), sinB = Math.sin(B);
    const cosC = Math.cos(C), sinC = Math.sin(C);

    switch (props.pattern) {
      case "donut": {
        const output: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(" "));
        const zbuffer: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));
        const colorBuffer: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));

        const R1 = 1, R2 = 2;
        const K1 = cols * 0.3;
        const K2 = 5;

        for (let theta = 0; theta < 6.28; theta += 0.07) {
          for (let phi = 0; phi < 6.28; phi += 0.02) {
            const cosTheta = Math.cos(theta), sinTheta = Math.sin(theta);
            const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);

            const circleX = R2 + R1 * cosTheta;
            const circleY = R1 * sinTheta;

            const x = circleX * (cosB * cosPhi + sinA * sinB * sinPhi) - circleY * cosA * sinB;
            const y = circleX * (sinB * cosPhi - sinA * cosB * sinPhi) + circleY * cosA * cosB;
            const z = K2 + cosA * circleX * sinPhi + circleY * sinA;
            const ooz = 1 / z;

            const xp = Math.floor(cols / 2 + K1 * ooz * x);
            const yp = Math.floor(rows / 2 - K1 * ooz * y * 0.5);

            const L = cosPhi * cosTheta * sinB - cosA * cosTheta * sinPhi - sinA * sinTheta + cosB * (cosA * sinTheta - cosTheta * sinA * sinPhi);

            if (L > 0 && xp >= 0 && xp < cols && yp >= 0 && yp < rows) {
              if (ooz > zbuffer[yp][xp]) {
                zbuffer[yp][xp] = ooz;
                const luminanceIndex = Math.floor(L * 8);
                output[yp][xp] = ASCII_CHARS[Math.max(0, Math.min(luminanceIndex, ASCII_CHARS.length - 1))];
                colorBuffer[yp][xp] = L;
              }
            }
          }
        }

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (output[y][x] !== " ") {
              ctx.fillStyle = getColor(colorBuffer[y][x], props);
              ctx.fillText(output[y][x], x * fontSize * 0.6, y * fontSize);
            }
          }
        }
        break;
      }

      case "matrix": {
        // Initialize drops if needed
        if (matrixDropsRef.current.length !== cols) {
          matrixDropsRef.current = Array(cols).fill(0).map(() => Math.random() * rows);
        }

        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < cols; i++) {
          const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          const x = i * fontSize * 0.6;
          const y = matrixDropsRef.current[i] * fontSize;

          // Head of the drop (bright)
          ctx.fillStyle = getColor(1, props);
          ctx.fillText(char, x, y);

          // Trail
          for (let t = 1; t < 20; t++) {
            const trailY = y - t * fontSize;
            if (trailY > 0) {
              const fade = 1 - t / 20;
              ctx.fillStyle = getColor(fade * 0.7, props);
              const trailChar = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
              ctx.fillText(trailChar, x, trailY);
            }
          }

          // Reset drop
          if (matrixDropsRef.current[i] * fontSize > height && Math.random() > 0.975) {
            matrixDropsRef.current[i] = 0;
          }
          matrixDropsRef.current[i] += 0.5 * props.speed;
        }
        break;
      }

      case "cube": {
        const output: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(" "));
        const zbuffer: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(-Infinity));
        const colorBuffer: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));

        const size = 1.5;
        const K1 = cols * 0.25;
        const K2 = 5;

        // Draw cube faces
        const faces = [
          { normal: [0, 0, 1], offset: size },
          { normal: [0, 0, -1], offset: size },
          { normal: [0, 1, 0], offset: size },
          { normal: [0, -1, 0], offset: size },
          { normal: [1, 0, 0], offset: size },
          { normal: [-1, 0, 0], offset: size },
        ];

        for (const face of faces) {
          for (let u = -size; u <= size; u += 0.1) {
            for (let v = -size; v <= size; v += 0.1) {
              let x, y, z;
              if (face.normal[2] !== 0) {
                x = u; y = v; z = face.normal[2] * face.offset;
              } else if (face.normal[1] !== 0) {
                x = u; z = v; y = face.normal[1] * face.offset;
              } else {
                y = u; z = v; x = face.normal[0] * face.offset;
              }

              // Rotate
              const x1 = x * cosC - y * sinC;
              const y1 = x * sinC + y * cosC;
              const z1 = z;

              const x2 = x1 * cosB + z1 * sinB;
              const y2 = y1;
              const z2 = -x1 * sinB + z1 * cosB;

              const x3 = x2;
              const y3 = y2 * cosA - z2 * sinA;
              const z3 = y2 * sinA + z2 * cosA;

              const zp = K2 + z3;
              const ooz = 1 / zp;

              const xp = Math.floor(cols / 2 + K1 * ooz * x3);
              const yp = Math.floor(rows / 2 - K1 * ooz * y3 * 0.5);

              // Calculate lighting
              const nx = face.normal[0] * cosB * cosC - face.normal[1] * sinC + face.normal[2] * sinB * cosC;
              const ny = face.normal[0] * cosB * sinC + face.normal[1] * cosC + face.normal[2] * sinB * sinC;
              const nz = -face.normal[0] * sinB + face.normal[2] * cosB;
              const L = Math.max(0, -nz * 0.5 + 0.5);

              if (xp >= 0 && xp < cols && yp >= 0 && yp < rows && z3 > zbuffer[yp][xp]) {
                zbuffer[yp][xp] = z3;
                const charIndex = Math.floor(L * (ASCII_CHARS.length - 1));
                output[yp][xp] = ASCII_CHARS[charIndex];
                colorBuffer[yp][xp] = L;
              }
            }
          }
        }

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (output[y][x] !== " ") {
              ctx.fillStyle = getColor(colorBuffer[y][x], props);
              ctx.fillText(output[y][x], x * fontSize * 0.6, y * fontSize);
            }
          }
        }
        break;
      }

      case "sphere": {
        const output: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(" "));
        const zbuffer: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(-Infinity));
        const colorBuffer: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));

        const R = 2;
        const K1 = cols * 0.3;
        const K2 = 5;

        for (let theta = 0; theta < Math.PI; theta += 0.05) {
          for (let phi = 0; phi < 2 * Math.PI; phi += 0.05) {
            const x = R * Math.sin(theta) * Math.cos(phi);
            const y = R * Math.sin(theta) * Math.sin(phi);
            const z = R * Math.cos(theta);

            // Rotate
            const x1 = x * cosC - y * sinC;
            const y1 = x * sinC + y * cosC;
            const x2 = x1 * cosB + z * sinB;
            const z2 = -x1 * sinB + z * cosB;
            const y2 = y1 * cosA - z2 * sinA;
            const z3 = y1 * sinA + z2 * cosA;

            const zp = K2 + z3;
            const ooz = 1 / zp;

            const xp = Math.floor(cols / 2 + K1 * ooz * x2);
            const yp = Math.floor(rows / 2 - K1 * ooz * y2 * 0.5);

            // Normal for lighting
            const nx = Math.sin(theta) * Math.cos(phi);
            const ny = Math.sin(theta) * Math.sin(phi);
            const nz = Math.cos(theta);
            const L = Math.max(0, nx * 0.3 + ny * 0.3 + nz * 0.7);

            if (xp >= 0 && xp < cols && yp >= 0 && yp < rows && z3 > zbuffer[yp][xp]) {
              zbuffer[yp][xp] = z3;
              const charIndex = Math.floor(L * (ASCII_CHARS.length - 1));
              output[yp][xp] = ASCII_CHARS[charIndex];
              colorBuffer[yp][xp] = L;
            }
          }
        }

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (output[y][x] !== " ") {
              ctx.fillStyle = getColor(colorBuffer[y][x], props);
              ctx.fillText(output[y][x], x * fontSize * 0.6, y * fontSize);
            }
          }
        }
        break;
      }

      case "plasma": {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const px = x / cols;
            const py = y / rows;

            let v = Math.sin(px * 10 + elapsed);
            v += Math.sin((py * 10 + elapsed) * 0.5);
            v += Math.sin((px + py) * 5 + elapsed * 0.5);
            v += Math.sin(Math.sqrt(px * px + py * py) * 10 - elapsed);
            v = (v + 4) / 8;

            const charIndex = Math.floor(v * (ASCII_CHARS.length - 1));
            ctx.fillStyle = getColor(v, props);
            ctx.fillText(ASCII_CHARS[charIndex], x * fontSize * 0.6, y * fontSize);
          }
        }
        break;
      }

      case "tunnel": {
        const cx = cols / 2;
        const cy = rows / 2;

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const dx = x - cx;
            const dy = (y - cy) * 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            if (dist < 1) continue;

            const depth = 50 / dist + elapsed * 3;
            const v = (Math.sin(depth) * Math.cos(angle * 8 + elapsed) + 1) / 2;

            const charIndex = Math.floor(v * (ASCII_CHARS.length - 1));
            ctx.fillStyle = getColor(v, props);
            ctx.fillText(ASCII_CHARS[charIndex], x * fontSize * 0.6, y * fontSize);
          }
        }
        break;
      }

      case "wave": {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const px = x / cols;
            const py = y / rows;

            const wave1 = Math.sin(px * 15 + elapsed * 2) * 0.5;
            const wave2 = Math.sin(py * 10 - elapsed * 1.5) * 0.3;
            const wave3 = Math.sin((px + py) * 8 + elapsed) * 0.2;

            let v = (wave1 + wave2 + wave3 + 1) / 2;
            v = Math.max(0, Math.min(1, v));

            const charIndex = Math.floor(v * (ASCII_CHARS.length - 1));
            ctx.fillStyle = getColor(v, props);
            ctx.fillText(ASCII_CHARS[charIndex], x * fontSize * 0.6, y * fontSize);
          }
        }
        break;
      }

      case "spiral": {
        const cx = cols / 2;
        const cy = rows / 2;

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const dx = x - cx;
            const dy = (y - cy) * 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            const spiral = Math.sin(dist * 0.3 - angle * 3 + elapsed * 2);
            const v = (spiral + 1) / 2;

            const charIndex = Math.floor(v * (ASCII_CHARS.length - 1));
            ctx.fillStyle = getColor(v, props);
            ctx.fillText(ASCII_CHARS[charIndex], x * fontSize * 0.6, y * fontSize);
          }
        }
        break;
      }
    }

    animationRef.current = requestAnimationFrame(render);
  }, [getColor]);

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
        matrixDropsRef.current = []; // Reset matrix drops on resize
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
      style={{ width: "100%", height: "100%", display: "block", backgroundColor: "#000" }}
    />
  );
});

AsciiCanvas.displayName = "AsciiCanvas";

export default AsciiCanvas;
