import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Noise, Vignette } from "../components/effects";
import { getRainbowColor, RainbowConfig, defaultRainbowConfig } from "../utils/colors";

type AsciiPattern =
  | "matrix"
  | "donut"
  | "cube"
  | "plasma"
  | "tunnel"
  | "wave"
  | "sphere"
  | "spiral";

type ColorMode = "single" | "rainbow" | "green";

interface AsciiAnimationProps {
  pattern: AsciiPattern;
  backgroundColor: string;
  textColor: string;
  colorMode: ColorMode;
  rainbowConfig?: RainbowConfig;
  speed: number;
  density: number;
  enableNoise: boolean;
  enableVignette: boolean;
  seed: number;
  // 3D rotation controls
  rotationX?: number; // -180 to 180 degrees
  rotationY?: number; // -180 to 180 degrees
  rotationZ?: number; // -180 to 180 degrees
  autoRotate?: boolean; // Enable auto rotation
  autoRotateSpeedX?: number;
  autoRotateSpeedY?: number;
  autoRotateSpeedZ?: number;
}

// ASCII density characters from light to dark
const ASCII_GRADIENT = " .,-~:;=!*#$@";
const ASCII_GRADIENT_LONG = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

// Matrix-style characters
const MATRIX_CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Seeded random
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Convert degrees to radians
const degToRad = (deg: number): number => (deg * Math.PI) / 180;

export const AsciiAnimation: React.FC<AsciiAnimationProps> = ({
  pattern = "donut",
  backgroundColor = "#000000",
  textColor = "#ffffff",
  colorMode = "green",
  rainbowConfig = defaultRainbowConfig,
  speed = 1,
  density = 1,
  enableNoise = true,
  enableVignette = true,
  seed = 42,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
  autoRotate = true,
  autoRotateSpeedX = 1,
  autoRotateSpeedY = 0.8,
  autoRotateSpeedZ = 0.5,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const time = (frame / fps) * speed;

  // Calculate actual rotation angles (manual + auto)
  const actualRotX = autoRotate
    ? degToRad(rotationX) + time * autoRotateSpeedX
    : degToRad(rotationX);
  const actualRotY = autoRotate
    ? degToRad(rotationY) + time * autoRotateSpeedY
    : degToRad(rotationY);
  const actualRotZ = autoRotate
    ? degToRad(rotationZ) + time * autoRotateSpeedZ
    : degToRad(rotationZ);

  // Grid dimensions based on density
  const baseCols = 80;
  const baseRows = 40;
  const cols = Math.floor(baseCols * density);
  const rows = Math.floor(baseRows * density);
  const charWidth = width / cols;
  const charHeight = height / rows;
  const fontSize = Math.min(charWidth, charHeight) * 1.3;

  // Generate ASCII grid based on pattern
  const asciiGrid = useMemo(() => {
    const grid: { char: string; brightness: number; colorIndex: number }[][] = [];

    switch (pattern) {
      case "matrix": {
        // Matrix rain effect
        const drops: number[] = [];
        for (let i = 0; i < cols; i++) {
          drops[i] = seededRandom(seed + i) * rows;
        }

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const dropSpeed = 0.3 + seededRandom(seed + col * 100) * 0.4;
            const dropY = (drops[col] + time * 15 * dropSpeed) % (rows + 20);
            const distFromHead = row - dropY;

            let brightness = 0;
            let char = " ";

            if (distFromHead >= 0 && distFromHead < 15) {
              // Trail
              brightness = 1 - distFromHead / 15;
              const charSeed = seed + row * cols + col + Math.floor(time * 10);
              const charIndex = Math.floor(seededRandom(charSeed) * MATRIX_CHARS.length);
              char = MATRIX_CHARS[charIndex];
            } else if (distFromHead >= -1 && distFromHead < 0) {
              // Head (brightest)
              brightness = 1.2;
              const charSeed = seed + row * cols + col + Math.floor(time * 20);
              const charIndex = Math.floor(seededRandom(charSeed) * MATRIX_CHARS.length);
              char = MATRIX_CHARS[charIndex];
            }

            gridRow.push({ char, brightness, colorIndex: col });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "donut": {
        // 3D rotating donut/torus with controllable rotation
        const A = actualRotX;
        const B = actualRotY;

        // Z-buffer and luminance buffer
        const zBuffer: number[][] = [];
        const luminance: number[][] = [];

        for (let i = 0; i < rows; i++) {
          zBuffer[i] = new Array(cols).fill(0);
          luminance[i] = new Array(cols).fill(0);
        }

        const R1 = 1; // Radius of the tube
        const R2 = 2; // Distance from center to tube center
        const K2 = 5;
        const K1 = cols * K2 * 3 / (8 * (R1 + R2));

        // Render torus
        for (let theta = 0; theta < 6.28; theta += 0.07) {
          for (let phi = 0; phi < 6.28; phi += 0.02) {
            const cosA = Math.cos(A), sinA = Math.sin(A);
            const cosB = Math.cos(B), sinB = Math.sin(B);
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

            // Luminance calculation
            const L = cosPhi * cosTheta * sinB - cosA * cosTheta * sinPhi - sinA * sinTheta + cosB * (cosA * sinTheta - cosTheta * sinA * sinPhi);

            if (L > 0 && xp >= 0 && xp < cols && yp >= 0 && yp < rows) {
              if (ooz > zBuffer[yp][xp]) {
                zBuffer[yp][xp] = ooz;
                luminance[yp][xp] = L;
              }
            }
          }
        }

        // Convert to ASCII
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const L = luminance[row][col];
            let char = " ";
            let brightness = 0;

            if (L > 0) {
              const charIndex = Math.floor(L * 8);
              char = ".,-~:;=!*#$@"[Math.min(charIndex, 11)];
              brightness = L;
            }

            gridRow.push({ char, brightness, colorIndex: row + col });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "cube": {
        // 3D rotating cube with controllable rotation
        const rotX = actualRotX;
        const rotY = actualRotY;
        const rotZ = actualRotZ;

        // Cube vertices
        const vertices = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
        ];

        // Edges
        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ];

        // Rotation matrices
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

        const rotate = (v: number[]): number[] => {
          let [x, y, z] = v;
          // Rotate X
          let temp = y;
          y = y * cosX - z * sinX;
          z = temp * sinX + z * cosX;
          // Rotate Y
          temp = x;
          x = x * cosY + z * sinY;
          z = -temp * sinY + z * cosY;
          // Rotate Z
          temp = x;
          x = x * cosZ - y * sinZ;
          y = temp * sinZ + y * cosZ;
          return [x, y, z];
        };

        // Project to 2D
        const project = (v: number[]): [number, number] => {
          const scale = 12;
          const distance = 5;
          const factor = distance / (distance + v[2]);
          return [
            Math.floor(cols / 2 + v[0] * scale * factor),
            Math.floor(rows / 2 + v[1] * scale * factor * 0.5),
          ];
        };

        // Initialize empty grid
        const charGrid: string[][] = [];
        for (let i = 0; i < rows; i++) {
          charGrid[i] = new Array(cols).fill(" ");
        }

        // Draw edges using Bresenham's line algorithm
        const drawLine = (x0: number, y0: number, x1: number, y1: number, char: string) => {
          const dx = Math.abs(x1 - x0);
          const dy = Math.abs(y1 - y0);
          const sx = x0 < x1 ? 1 : -1;
          const sy = y0 < y1 ? 1 : -1;
          let err = dx - dy;

          while (true) {
            if (x0 >= 0 && x0 < cols && y0 >= 0 && y0 < rows) {
              charGrid[y0][x0] = char;
            }
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
          }
        };

        // Draw cube
        for (const [i, j] of edges) {
          const v1 = rotate(vertices[i]);
          const v2 = rotate(vertices[j]);
          const [x1, y1] = project(v1);
          const [x2, y2] = project(v2);
          const edgeChar = v1[2] + v2[2] > 0 ? "#" : "-";
          drawLine(x1, y1, x2, y2, edgeChar);
        }

        // Draw vertices
        for (const v of vertices) {
          const rotated = rotate(v);
          const [x, y] = project(rotated);
          if (x >= 0 && x < cols && y >= 0 && y < rows) {
            charGrid[y][x] = "@";
          }
        }

        // Convert to grid format
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const char = charGrid[row][col];
            gridRow.push({
              char,
              brightness: char === "@" ? 1 : char === "#" ? 0.8 : char === "-" ? 0.5 : 0,
              colorIndex: row + col,
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "plasma": {
        // Animated plasma effect
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const x = col / cols * 4;
            const y = row / rows * 4;

            // Multiple sine waves combined
            let value = Math.sin(x * 3 + time * 2);
            value += Math.sin(y * 2 + time * 1.5);
            value += Math.sin((x + y) * 1.5 + time);
            value += Math.sin(Math.sqrt(x * x + y * y) * 2 - time * 2);
            value = (value + 4) / 8; // Normalize to 0-1

            const charIndex = Math.floor(value * (ASCII_GRADIENT_LONG.length - 1));
            const char = ASCII_GRADIENT_LONG[charIndex];

            gridRow.push({
              char,
              brightness: value,
              colorIndex: Math.floor(value * 360),
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "tunnel": {
        // Tunnel zoom effect
        const centerX = cols / 2;
        const centerY = rows / 2;

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const dx = col - centerX;
            const dy = (row - centerY) * 2; // Aspect ratio correction
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Tunnel depth calculation
            const depth = 50 / (distance + 1);
            const tunnelZ = depth + time * 5;

            // Create ring pattern
            const ringValue = Math.sin(tunnelZ * 2 + angle * 8) * 0.5 + 0.5;
            const brightness = ringValue * Math.min(1, distance / 5);

            const charIndex = Math.floor(brightness * (ASCII_GRADIENT.length - 1));
            const char = distance < 2 ? " " : ASCII_GRADIENT[charIndex];

            gridRow.push({
              char,
              brightness,
              colorIndex: Math.floor(angle * 180 / Math.PI + 180),
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "wave": {
        // 3D sine wave surface
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const x = (col - cols / 2) / 10;
            const y = (row - rows / 2) / 5;

            // Multiple overlapping waves
            let z = Math.sin(x * 2 + time * 3) * Math.cos(y * 2 + time * 2);
            z += Math.sin(Math.sqrt(x * x + y * y) * 3 - time * 4) * 0.5;

            // Simple lighting
            const dxVal = Math.cos(x * 2 + time * 3) * 2 * Math.cos(y * 2 + time * 2);
            const dyVal = Math.sin(x * 2 + time * 3) * (-Math.sin(y * 2 + time * 2) * 2);
            const light = (dxVal + dyVal + 2) / 4;

            const brightness = Math.max(0, Math.min(1, (z + 1.5) / 3 * light));
            const charIndex = Math.floor(brightness * (ASCII_GRADIENT_LONG.length - 1));
            const char = ASCII_GRADIENT_LONG[Math.max(0, charIndex)];

            gridRow.push({
              char,
              brightness,
              colorIndex: Math.floor((z + 1.5) * 120),
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "sphere": {
        // 3D rotating sphere with controllable rotation
        const rotY = actualRotY;
        const rotX = actualRotX;

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const px = (col - cols / 2) / (cols / 4);
            const py = (row - rows / 2) / (rows / 4) * 2;

            const r2 = px * px + py * py;
            let char = " ";
            let brightness = 0;

            if (r2 <= 1) {
              // Point is on sphere surface
              const pz = Math.sqrt(1 - r2);

              // Apply X rotation first
              let x1 = px;
              let y1 = py * Math.cos(rotX) - pz * Math.sin(rotX);
              let z1 = py * Math.sin(rotX) + pz * Math.cos(rotX);

              // Then Y rotation
              const finalX = x1 * Math.cos(rotY) + z1 * Math.sin(rotY);
              const finalY = y1;
              const finalZ = -x1 * Math.sin(rotY) + z1 * Math.cos(rotY);

              // Checker pattern on sphere
              const u = Math.atan2(finalX, finalZ) / Math.PI;
              const v = Math.asin(Math.max(-1, Math.min(1, finalY))) / (Math.PI / 2);
              const checker = (Math.floor(u * 8) + Math.floor(v * 8)) % 2;

              // Lighting (simple diffuse)
              const lightDir = [0.5, -0.5, 0.7];
              const mag = Math.sqrt(lightDir[0]**2 + lightDir[1]**2 + lightDir[2]**2);
              const light = Math.max(0, (finalX * lightDir[0] + finalY * lightDir[1] + finalZ * lightDir[2]) / mag);

              brightness = (light * 0.7 + 0.3) * (checker ? 1 : 0.5);
              const charIndex = Math.floor(brightness * (ASCII_GRADIENT.length - 1));
              char = ASCII_GRADIENT[charIndex];
            }

            gridRow.push({
              char,
              brightness,
              colorIndex: Math.floor(brightness * 360),
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "spiral": {
        // Animated spiral pattern
        const centerX = cols / 2;
        const centerY = rows / 2;

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const dx = col - centerX;
            const dy = (row - centerY) * 2;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Spiral arms
            const spiralAngle = angle + distance * 0.15 - time * 3;
            const armValue = Math.sin(spiralAngle * 4) * 0.5 + 0.5;

            // Fade out from center
            const fade = Math.min(1, distance / 10);
            const brightness = armValue * fade;

            const charIndex = Math.floor(brightness * (ASCII_GRADIENT_LONG.length - 1));
            const char = ASCII_GRADIENT_LONG[charIndex];

            gridRow.push({
              char,
              brightness,
              colorIndex: Math.floor(((angle / Math.PI + 1) * 180 + time * 50) % 360),
            });
          }
          grid.push(gridRow);
        }
        break;
      }
    }

    return grid;
  }, [pattern, cols, rows, time, seed, actualRotX, actualRotY, actualRotZ]);

  // Get color for a cell
  const getCellColor = (brightness: number, colorIndex: number): string => {
    if (colorMode === "green") {
      // Matrix green
      const green = Math.floor(100 + brightness * 155);
      return `rgb(0, ${green}, 0)`;
    } else if (colorMode === "rainbow") {
      return getRainbowColor(colorIndex, 360, rainbowConfig, frame, fps);
    }
    return textColor;
  };

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      {/* ASCII Grid */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Courier New', 'Monaco', monospace",
          fontSize: `${fontSize}px`,
          lineHeight: `${charHeight}px`,
          letterSpacing: "0px",
        }}
      >
        {asciiGrid.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: "flex",
              whiteSpace: "pre",
              height: `${charHeight}px`,
            }}
          >
            {row.map((cell, colIndex) => (
              <span
                key={colIndex}
                style={{
                  width: `${charWidth}px`,
                  height: `${charHeight}px`,
                  display: "inline-block",
                  textAlign: "center",
                  color: getCellColor(cell.brightness, cell.colorIndex),
                  opacity: Math.max(0.1, cell.brightness),
                  textShadow: cell.brightness > 0.7 && colorMode === "green"
                    ? `0 0 10px rgba(0, 255, 0, ${cell.brightness * 0.5})`
                    : "none",
                }}
              >
                {cell.char}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Effects */}
      {enableNoise && <Noise opacity={0.08} animated />}
      {enableVignette && <Vignette intensity={0.6} />}

      {/* Scanline effect for retro look */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.1) 0px,
            rgba(0, 0, 0, 0.1) 1px,
            transparent 1px,
            transparent 3px
          )`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

export default AsciiAnimation;
