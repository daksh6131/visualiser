"use client";

import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";

type AsciiPattern = "donut" | "matrix" | "cube" | "sphere" | "plasma" | "tunnel" | "wave" | "spiral" | "image" | "fire" | "rain" | "starfield";
type ColorMode = "green" | "single" | "rainbow" | "grayscale" | "neon";
type CharacterSet = "standard" | "detailed" | "blocks" | "binary" | "minimal" | "braille" | "japanese" | "arrows" | "custom";
type FontFamily = "monospace" | "courier" | "consolas" | "firacode" | "jetbrains";
type RenderMode = "normal" | "edges" | "dither" | "contrast";

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
  imageData?: string;
  imageInvert?: boolean;
  imageAnimate?: boolean;
  // New granular controls
  cellSize?: number;           // Character size in pixels (4-32)
  characterSet?: CharacterSet; // Which character set to use
  customChars?: string;        // Custom character string
  fontFamily?: FontFamily;     // Font to use
  charSpacingX?: number;       // Horizontal spacing multiplier
  charSpacingY?: number;       // Vertical spacing multiplier
  contrast?: number;           // Contrast adjustment (0.5-2)
  brightness?: number;         // Brightness adjustment (-0.5 to 0.5)
  bgOpacity?: number;          // Background opacity (0-1)
  renderMode?: RenderMode;     // How to render the ASCII
  glowEffect?: boolean;        // Add glow to characters
  glowIntensity?: number;      // Glow intensity (0-2)
  scanlines?: boolean;         // Add scanline effect
  chromatic?: boolean;         // Chromatic aberration effect
}

export interface AsciiCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

// Character sets for different styles
const CHARACTER_SETS: Record<CharacterSet, string> = {
  standard: ".,-~:;=!*#$@",
  detailed: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█",
  binary: "01",
  minimal: " .-+*#",
  braille: "⠀⠁⠂⠃⠄⠅⠆⠇⡀⡁⡂⡃⡄⡅⡆⡇⠈⠉⠊⠋⠌⠍⠎⠏⡈⡉⡊⡋⡌⡍⡎⡏⠐⠑⠒⠓⠔⠕⠖⠗⡐⡑⡒⡓⡔⡕⡖⡗⠘⠙⠚⠛⠜⠝⠞⠟⡘⡙⡚⡛⡜⡝⡞⡟",
  japanese: "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ",
  arrows: "→↗↑↖←↙↓↘●○◐◑◒◓",
  custom: "",
};

const MATRIX_CHARS = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789";

const FONT_MAP: Record<FontFamily, string> = {
  monospace: "monospace",
  courier: "'Courier New', Courier, monospace",
  consolas: "Consolas, monospace",
  firacode: "'Fira Code', monospace",
  jetbrains: "'JetBrains Mono', monospace",
};

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
  imageData,
  imageInvert = false,
  imageAnimate = true,
  // New props with defaults
  cellSize = 14,
  characterSet = "standard",
  customChars = "",
  fontFamily = "monospace",
  charSpacingX = 0.6,
  charSpacingY = 1.0,
  contrast = 1,
  brightness = 0,
  bgOpacity = 0.9,
  renderMode = "normal",
  glowEffect = false,
  glowIntensity = 1,
  scanlines = false,
  chromatic = false,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const matrixDropsRef = useRef<number[]>([]);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageBrightnessRef = useRef<number[][] | null>(null);
  const fireBufferRef = useRef<number[][]>([]);
  const starsRef = useRef<Array<{x: number, y: number, z: number, speed: number}>>([]);
  const rainDropsRef = useRef<Array<{x: number, y: number, speed: number, length: number, char: string}>>([]);

  const propsRef = useRef({
    pattern, speed, density, colorMode, textColor,
    hueStart, hueEnd, saturation, lightness,
    rotationX, rotationY, rotationZ,
    autoRotate, autoRotateSpeedX, autoRotateSpeedY, autoRotateSpeedZ,
    imageInvert, imageAnimate,
    cellSize, characterSet, customChars, fontFamily, charSpacingX, charSpacingY,
    contrast, brightness, bgOpacity, renderMode, glowEffect, glowIntensity,
    scanlines, chromatic,
  });

  useEffect(() => {
    propsRef.current = {
      pattern, speed, density, colorMode, textColor,
      hueStart, hueEnd, saturation, lightness,
      rotationX, rotationY, rotationZ,
      autoRotate, autoRotateSpeedX, autoRotateSpeedY, autoRotateSpeedZ,
      imageInvert, imageAnimate,
      cellSize, characterSet, customChars, fontFamily, charSpacingX, charSpacingY,
      contrast, brightness, bgOpacity, renderMode, glowEffect, glowIntensity,
      scanlines, chromatic,
    };
  }, [pattern, speed, density, colorMode, textColor, hueStart, hueEnd, saturation, lightness, rotationX, rotationY, rotationZ, autoRotate, autoRotateSpeedX, autoRotateSpeedY, autoRotateSpeedZ, imageInvert, imageAnimate, cellSize, characterSet, customChars, fontFamily, charSpacingX, charSpacingY, contrast, brightness, bgOpacity, renderMode, glowEffect, glowIntensity, scanlines, chromatic]);

  // Load image when imageData changes
  useEffect(() => {
    if (!imageData) {
      imageRef.current = null;
      imageBrightnessRef.current = null;
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      // Pre-process image brightness
      const tempCanvas = document.createElement('canvas');
      const maxSize = 300; // Higher resolution for more detail
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      tempCanvas.width = Math.floor(img.width * scale);
      tempCanvas.height = Math.floor(img.height * scale);
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const brightness: number[][] = [];
        for (let y = 0; y < tempCanvas.height; y++) {
          brightness[y] = [];
          for (let x = 0; x < tempCanvas.width; x++) {
            const i = (y * tempCanvas.width + x) * 4;
            const r = imgData.data[i];
            const g = imgData.data[i + 1];
            const b = imgData.data[i + 2];
            // Perceived brightness formula
            brightness[y][x] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          }
        }
        imageBrightnessRef.current = brightness;
        imageCanvasRef.current = tempCanvas;
      }
    };
    img.src = imageData;
  }, [imageData]);

  // Get the active character set
  const getChars = useCallback((props: typeof propsRef.current): string => {
    if (props.characterSet === "custom" && props.customChars) {
      return props.customChars;
    }
    return CHARACTER_SETS[props.characterSet] || CHARACTER_SETS.standard;
  }, []);

  // Apply contrast and brightness to a value
  const applyAdjustments = useCallback((value: number, props: typeof propsRef.current): number => {
    // Apply contrast (centered around 0.5)
    let v = (value - 0.5) * props.contrast + 0.5;
    // Apply brightness
    v = v + props.brightness;
    // Clamp
    return Math.max(0, Math.min(1, v));
  }, []);

  const getColor = useCallback((value: number, props: typeof propsRef.current, x?: number, y?: number): string => {
    const v = applyAdjustments(value, props);

    if (props.colorMode === "green") {
      const brightness = Math.floor(v * 255);
      return `rgb(0, ${brightness}, 0)`;
    } else if (props.colorMode === "rainbow") {
      const hueRange = props.hueEnd - props.hueStart;
      const hue = props.hueStart + v * hueRange;
      return `hsl(${hue}, ${props.saturation}%, ${props.lightness}%)`;
    } else if (props.colorMode === "grayscale") {
      const brightness = Math.floor(v * 255);
      return `rgb(${brightness}, ${brightness}, ${brightness})`;
    } else if (props.colorMode === "neon") {
      // Neon color cycling through cyan, magenta, yellow
      const hue = ((x || 0) * 2 + (y || 0) * 2) % 360;
      return `hsl(${hue}, 100%, ${50 + v * 30}%)`;
    } else {
      return props.textColor;
    }
  }, [applyAdjustments]);

  // Sobel edge detection for images
  const detectEdges = useCallback((brightness: number[][], x: number, y: number): number => {
    if (y <= 0 || y >= brightness.length - 1 || x <= 0 || x >= brightness[0].length - 1) {
      return 0;
    }

    // Sobel kernels
    const gx =
      -brightness[y-1][x-1] + brightness[y-1][x+1] +
      -2*brightness[y][x-1] + 2*brightness[y][x+1] +
      -brightness[y+1][x-1] + brightness[y+1][x+1];

    const gy =
      -brightness[y-1][x-1] - 2*brightness[y-1][x] - brightness[y-1][x+1] +
      brightness[y+1][x-1] + 2*brightness[y+1][x] + brightness[y+1][x+1];

    return Math.sqrt(gx * gx + gy * gy);
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

    // Get character set
    const chars = getChars(props);

    // Calculate font size based on cellSize and density
    const fontSize = Math.max(4, Math.floor(props.cellSize * props.density));
    const fontName = FONT_MAP[props.fontFamily];
    ctx.font = `${fontSize}px ${fontName}`;

    const charWidth = fontSize * props.charSpacingX;
    const charHeight = fontSize * props.charSpacingY;
    const cols = Math.floor(width / charWidth);
    const rows = Math.floor(height / charHeight);

    // Clear with variable opacity
    ctx.fillStyle = `rgba(0, 0, 0, ${props.bgOpacity})`;
    ctx.fillRect(0, 0, width, height);

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

    // Helper to draw character with effects
    // Note: Chromatic aberration is applied as a post-process effect instead of per-character
    // to avoid 3x draw calls which causes major performance issues
    const drawChar = (char: string, x: number, y: number, colorValue: number, col: number, row: number) => {
      const color = getColor(colorValue, props, col, row);

      if (props.glowEffect) {
        ctx.shadowColor = color;
        ctx.shadowBlur = props.glowIntensity * 5;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = color;
      ctx.fillText(char, x, y);
    };

    // Helper to get char index from value
    const getCharFromValue = (v: number): string => {
      const adjusted = applyAdjustments(v, props);
      const charIndex = Math.floor(adjusted * (chars.length - 1));
      return chars[Math.max(0, Math.min(charIndex, chars.length - 1))];
    };

    switch (props.pattern) {
      case "donut": {
        const output: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(" "));
        const zbuffer: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));
        const colorBuffer: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));

        const R1 = 1, R2 = 2;
        const K1 = cols * 0.3;
        const K2 = 5;

        const thetaStep = 0.07 / props.density;
        const phiStep = 0.02 / props.density;

        for (let theta = 0; theta < 6.28; theta += thetaStep) {
          for (let phi = 0; phi < 6.28; phi += phiStep) {
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
                output[yp][xp] = getCharFromValue(L);
                colorBuffer[yp][xp] = L;
              }
            }
          }
        }

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (output[y][x] !== " ") {
              drawChar(output[y][x], x * charWidth, y * charHeight, colorBuffer[y][x], x, y);
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

        const matrixChars = props.characterSet === "japanese" ? MATRIX_CHARS :
                           (props.characterSet === "binary" ? "01" : chars);

        for (let i = 0; i < cols; i++) {
          const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const x = i * charWidth;
          const y = matrixDropsRef.current[i] * charHeight;

          // Head of the drop (bright)
          drawChar(char, x, y, 1, i, Math.floor(y / charHeight));

          // Trail
          const trailLength = Math.floor(20 * props.density);
          for (let t = 1; t < trailLength; t++) {
            const trailY = y - t * charHeight;
            if (trailY > 0) {
              const fade = 1 - t / trailLength;
              const trailChar = matrixChars[Math.floor(Math.random() * matrixChars.length)];
              drawChar(trailChar, x, trailY, fade * 0.7, i, Math.floor(trailY / charHeight));
            }
          }

          // Reset drop
          if (matrixDropsRef.current[i] * charHeight > height && Math.random() > 0.975) {
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
        const step = 0.1 / props.density;

        const faces = [
          { normal: [0, 0, 1], offset: size },
          { normal: [0, 0, -1], offset: size },
          { normal: [0, 1, 0], offset: size },
          { normal: [0, -1, 0], offset: size },
          { normal: [1, 0, 0], offset: size },
          { normal: [-1, 0, 0], offset: size },
        ];

        for (const face of faces) {
          for (let u = -size; u <= size; u += step) {
            for (let v = -size; v <= size; v += step) {
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

              const nx = face.normal[0] * cosB * cosC - face.normal[1] * sinC + face.normal[2] * sinB * cosC;
              const nz = -face.normal[0] * sinB + face.normal[2] * cosB;
              const L = Math.max(0, -nz * 0.5 + 0.5);

              if (xp >= 0 && xp < cols && yp >= 0 && yp < rows && z3 > zbuffer[yp][xp]) {
                zbuffer[yp][xp] = z3;
                output[yp][xp] = getCharFromValue(L);
                colorBuffer[yp][xp] = L;
              }
            }
          }
        }

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (output[y][x] !== " ") {
              drawChar(output[y][x], x * charWidth, y * charHeight, colorBuffer[y][x], x, y);
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
        const step = 0.05 / props.density;

        for (let theta = 0; theta < Math.PI; theta += step) {
          for (let phi = 0; phi < 2 * Math.PI; phi += step) {
            const x = R * Math.sin(theta) * Math.cos(phi);
            const y = R * Math.sin(theta) * Math.sin(phi);
            const z = R * Math.cos(theta);

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

            const nx = Math.sin(theta) * Math.cos(phi);
            const ny = Math.sin(theta) * Math.sin(phi);
            const nz = Math.cos(theta);
            const L = Math.max(0, nx * 0.3 + ny * 0.3 + nz * 0.7);

            if (xp >= 0 && xp < cols && yp >= 0 && yp < rows && z3 > zbuffer[yp][xp]) {
              zbuffer[yp][xp] = z3;
              output[yp][xp] = getCharFromValue(L);
              colorBuffer[yp][xp] = L;
            }
          }
        }

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (output[y][x] !== " ") {
              drawChar(output[y][x], x * charWidth, y * charHeight, colorBuffer[y][x], x, y);
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

            drawChar(getCharFromValue(v), x * charWidth, y * charHeight, v, x, y);
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

            drawChar(getCharFromValue(v), x * charWidth, y * charHeight, v, x, y);
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

            drawChar(getCharFromValue(v), x * charWidth, y * charHeight, v, x, y);
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

            drawChar(getCharFromValue(v), x * charWidth, y * charHeight, v, x, y);
          }
        }
        break;
      }

      case "fire": {
        // Initialize fire buffer if needed
        if (fireBufferRef.current.length !== rows || (fireBufferRef.current[0] && fireBufferRef.current[0].length !== cols)) {
          fireBufferRef.current = Array(rows).fill(null).map(() => Array(cols).fill(0));
        }

        const buffer = fireBufferRef.current;

        // Set bottom row on fire
        for (let x = 0; x < cols; x++) {
          buffer[rows - 1][x] = Math.random() > 0.3 ? 1 : 0;
        }

        // Propagate fire upward
        for (let y = 0; y < rows - 1; y++) {
          for (let x = 0; x < cols; x++) {
            const decay = Math.random() * 0.15;
            const spread = Math.floor(Math.random() * 3) - 1;
            const srcX = Math.max(0, Math.min(cols - 1, x + spread));
            buffer[y][x] = Math.max(0, buffer[y + 1][srcX] - decay);
          }
        }

        // Render
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const v = buffer[y][x];
            if (v > 0.1) {
              // Fire colors
              const hue = 30 - v * 30; // Orange to red
              ctx.fillStyle = `hsl(${hue}, 100%, ${v * 50 + 10}%)`;
              ctx.fillText(getCharFromValue(v), x * charWidth, y * charHeight);
            }
          }
        }
        break;
      }

      case "rain": {
        // Initialize raindrops if needed
        if (rainDropsRef.current.length === 0) {
          for (let i = 0; i < cols / 2; i++) {
            rainDropsRef.current.push({
              x: Math.random() * cols,
              y: Math.random() * rows,
              speed: 0.5 + Math.random() * 1.5,
              length: 3 + Math.floor(Math.random() * 8),
              char: chars[Math.floor(Math.random() * chars.length)],
            });
          }
        }

        // Render rain
        for (const drop of rainDropsRef.current) {
          // Draw drop
          for (let i = 0; i < drop.length; i++) {
            const y = drop.y - i;
            if (y >= 0 && y < rows) {
              const fade = 1 - i / drop.length;
              drawChar(drop.char, Math.floor(drop.x) * charWidth, Math.floor(y) * charHeight, fade, Math.floor(drop.x), Math.floor(y));
            }
          }

          // Update position
          drop.y += drop.speed * props.speed;
          if (drop.y > rows + drop.length) {
            drop.y = -drop.length;
            drop.x = Math.random() * cols;
          }
        }
        break;
      }

      case "starfield": {
        // Initialize stars if needed
        if (starsRef.current.length === 0) {
          for (let i = 0; i < 200; i++) {
            starsRef.current.push({
              x: Math.random() * 2 - 1,
              y: Math.random() * 2 - 1,
              z: Math.random(),
              speed: 0.002 + Math.random() * 0.008,
            });
          }
        }

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);

        const cx = cols / 2;
        const cy = rows / 2;

        for (const star of starsRef.current) {
          // Project star
          const scale = 1 / star.z;
          const screenX = Math.floor(cx + star.x * scale * cx);
          const screenY = Math.floor(cy + star.y * scale * cy);

          if (screenX >= 0 && screenX < cols && screenY >= 0 && screenY < rows) {
            const v = 1 - star.z;
            const char = v > 0.8 ? '@' : v > 0.6 ? '*' : v > 0.4 ? '+' : '.';
            drawChar(char, screenX * charWidth, screenY * charHeight, v, screenX, screenY);
          }

          // Move star
          star.z -= star.speed * props.speed;
          if (star.z <= 0) {
            star.z = 1;
            star.x = Math.random() * 2 - 1;
            star.y = Math.random() * 2 - 1;
          }
        }
        break;
      }

      case "image": {
        const brightness = imageBrightnessRef.current;
        if (!brightness || brightness.length === 0) {
          ctx.fillStyle = getColor(0.5, props);
          ctx.font = `${fontSize * 2}px ${fontName}`;
          ctx.textAlign = "center";
          ctx.fillText("Upload an image", width / 2, height / 2);
          ctx.font = `${fontSize}px ${fontName}`;
          ctx.textAlign = "left";
          break;
        }

        const imgRows = brightness.length;
        const imgCols = brightness[0].length;

        const imgAspect = imgCols / imgRows;
        const canvasAspect = cols / (rows * 2);

        let mappedCols = cols;
        let mappedRows = rows;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > canvasAspect) {
          mappedRows = Math.floor(cols / imgAspect / 2);
          offsetY = Math.floor((rows - mappedRows) / 2);
        } else {
          mappedCols = Math.floor(rows * 2 * imgAspect);
          offsetX = Math.floor((cols - mappedCols) / 2);
        }

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const imgX = Math.floor(((x - offsetX) / mappedCols) * imgCols);
            const imgY = Math.floor(((y - offsetY) / mappedRows) * imgRows);

            if (imgX < 0 || imgX >= imgCols || imgY < 0 || imgY >= imgRows) {
              continue;
            }

            let v = brightness[imgY][imgX];

            // Apply render mode
            if (props.renderMode === "edges") {
              v = detectEdges(brightness, imgX, imgY);
              v = Math.min(1, v * 2); // Amplify edges
            } else if (props.renderMode === "dither") {
              // Simple ordered dithering
              const threshold = ((x % 4) * 4 + (y % 4)) / 16;
              v = v > threshold ? 1 : 0;
            } else if (props.renderMode === "contrast") {
              // High contrast mode
              v = v > 0.5 ? 1 : 0;
            }

            if (props.imageInvert) {
              v = 1 - v;
            }

            if (props.imageAnimate) {
              const wave = Math.sin((x / cols) * 4 + (y / rows) * 4 + elapsed * 2) * 0.15;
              v = Math.max(0, Math.min(1, v + wave));
            }

            drawChar(getCharFromValue(v), x * charWidth, y * charHeight, v, x, y);
          }
        }
        break;
      }
    }

    // Apply scanlines effect
    if (props.scanlines) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 2);
      }
    }

    // Apply chromatic aberration using canvas compositing (much faster than pixel manipulation)
    // This creates a subtle RGB split effect without heavy pixel processing
    if (props.chromatic) {
      // Save current canvas content
      ctx.globalCompositeOperation = 'source-over';

      // Draw red-shifted copy
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.3;
      ctx.drawImage(canvas, 2, 0); // Shift right for red

      // Draw blue-shifted copy
      ctx.drawImage(canvas, -2, 0); // Shift left for blue

      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
    }

    animationRef.current = requestAnimationFrame(render);
  }, [getColor, getChars, applyAdjustments, detectEdges]);

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
        matrixDropsRef.current = [];
        rainDropsRef.current = [];
        fireBufferRef.current = [];
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
