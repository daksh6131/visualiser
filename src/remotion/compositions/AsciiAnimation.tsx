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
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  autoRotate?: boolean;
  autoRotateSpeedX?: number;
  autoRotateSpeedY?: number;
  autoRotateSpeedZ?: number;
}

// === MATHEMATICAL CONSTANTS ===
const PHI = (1 + Math.sqrt(5)) / 2; // Golden Ratio ≈ 1.618
const PHI_INV = 1 / PHI;            // Inverse Golden Ratio ≈ 0.618
const TAU = Math.PI * 2;            // Full circle
const GOLDEN_ANGLE = TAU * PHI_INV; // Golden Angle ≈ 2.399 radians (137.5°)

// ASCII density characters - carefully ordered by visual density
const ASCII_GRADIENT = " .·:;=+*#%@";
const ASCII_GRADIENT_LONG = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const MATRIX_CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";

// === EASING FUNCTIONS ===
// Attempt to create smooth, organic motion
const ease = {
  // Sine-based (smoothest, most natural)
  inOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,

  // Quadratic (subtle acceleration)
  inOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  // Circular (smooth arc motion)
  inOutCirc: (t: number): number =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // Exponential smoothstep (very smooth)
  smoothstep: (t: number): number => t * t * (3 - 2 * t),

  // Ken Perlin's improved smoothstep
  smootherstep: (t: number): number => t * t * t * (t * (t * 6 - 15) + 10),
};

// === NOISE FUNCTIONS ===
// Seeded pseudo-random (deterministic)
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// 2D hash function for noise
const hash2D = (x: number, y: number, seed: number): number => {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
  return n - Math.floor(n);
};

// Smooth interpolation between noise values (value noise)
const smoothNoise2D = (x: number, y: number, seed: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  // Smooth interpolation using smootherstep
  const u = ease.smootherstep(xf);
  const v = ease.smootherstep(yf);

  // Four corners
  const n00 = hash2D(xi, yi, seed);
  const n10 = hash2D(xi + 1, yi, seed);
  const n01 = hash2D(xi, yi + 1, seed);
  const n11 = hash2D(xi + 1, yi + 1, seed);

  // Bilinear interpolation
  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  return nx0 * (1 - v) + nx1 * v;
};

// Fractal Brownian Motion (layered noise)
const fbm = (x: number, y: number, seed: number, octaves: number = 4): number => {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise2D(x * frequency, y * frequency, seed + i * 100);
    maxValue += amplitude;
    amplitude *= PHI_INV; // Each octave is golden ratio smaller
    frequency *= PHI;     // Each octave is golden ratio higher frequency
  }

  return value / maxValue;
};

// Convert degrees to radians
const degToRad = (deg: number): number => (deg * Math.PI) / 180;

// Clamp value between min and max
const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

// Linear interpolation
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// Smooth periodic function (better than sin for some cases)
const smoothPeriodic = (t: number): number => {
  const x = ((t % 1) + 1) % 1; // Normalize to 0-1
  return ease.smootherstep(x < 0.5 ? x * 2 : 2 - x * 2);
};

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

  // Smooth time with golden ratio relationship
  const time = (frame / fps) * speed;

  // Use golden ratio for rotation speed relationships (creates pleasing non-repeating patterns)
  const actualRotX = autoRotate
    ? degToRad(rotationX) + time * autoRotateSpeedX
    : degToRad(rotationX);
  const actualRotY = autoRotate
    ? degToRad(rotationY) + time * autoRotateSpeedY * PHI_INV
    : degToRad(rotationY);
  const actualRotZ = autoRotate
    ? degToRad(rotationZ) + time * autoRotateSpeedZ * PHI_INV * PHI_INV
    : degToRad(rotationZ);

  // Grid dimensions based on density
  const baseCols = 100;
  const baseRows = 50;
  const cols = Math.floor(baseCols * density);
  const rows = Math.floor(baseRows * density);
  const charWidth = width / cols;
  const charHeight = height / rows;
  const fontSize = Math.min(charWidth, charHeight) * 1.2;

  // Generate ASCII grid based on pattern
  const asciiGrid = useMemo(() => {
    const grid: { char: string; brightness: number; colorIndex: number }[][] = [];

    switch (pattern) {
      case "matrix": {
        // Matrix rain with golden ratio timing
        const numDrops = Math.floor(cols * PHI_INV);
        const drops: { x: number; speed: number; length: number; offset: number }[] = [];

        for (let i = 0; i < numDrops; i++) {
          const x = Math.floor(seededRandom(seed + i) * cols);
          drops.push({
            x,
            speed: 0.3 + seededRandom(seed + i * 100) * 0.5,
            length: 8 + Math.floor(seededRandom(seed + i * 200) * 15),
            offset: seededRandom(seed + i * 300) * rows * 2,
          });
        }

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            let brightness = 0;
            let char = " ";

            // Check all drops
            for (const drop of drops) {
              if (Math.abs(drop.x - col) < 1) {
                const dropY = ((drop.offset + time * 20 * drop.speed) % (rows + drop.length + 10)) - drop.length;
                const distFromHead = row - dropY;

                if (distFromHead >= 0 && distFromHead < drop.length) {
                  // Smooth falloff using golden ratio
                  const normalizedDist = distFromHead / drop.length;
                  const falloff = 1 - ease.smootherstep(normalizedDist);

                  if (falloff > brightness) {
                    brightness = falloff;
                    // Character changes smoothly
                    const charSeed = seed + row * cols + col + Math.floor(time * (5 + drop.speed * 5));
                    const charIndex = Math.floor(seededRandom(charSeed) * MATRIX_CHARS.length);
                    char = MATRIX_CHARS[charIndex];
                  }
                } else if (distFromHead >= -1 && distFromHead < 0) {
                  // Bright head
                  brightness = 1.2;
                  const charSeed = seed + row * cols + col + Math.floor(time * 15);
                  char = MATRIX_CHARS[Math.floor(seededRandom(charSeed) * MATRIX_CHARS.length)];
                }
              }
            }

            gridRow.push({ char, brightness, colorIndex: col });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "donut": {
        // 3D torus with golden ratio proportions
        const A = actualRotX;
        const B = actualRotY;

        const zBuffer: number[][] = [];
        const luminance: number[][] = [];

        for (let i = 0; i < rows; i++) {
          zBuffer[i] = new Array(cols).fill(0);
          luminance[i] = new Array(cols).fill(0);
        }

        // Golden ratio torus proportions
        const R1 = 1;           // Tube radius
        const R2 = R1 * PHI;    // Distance to tube center (golden ratio!)
        const K2 = 5;
        const K1 = cols * K2 * 3 / (8 * (R1 + R2));

        // Higher resolution sampling for smoother surface
        const thetaStep = 0.04;
        const phiStep = 0.015;

        for (let theta = 0; theta < TAU; theta += thetaStep) {
          for (let phi = 0; phi < TAU; phi += phiStep) {
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

            // Improved lighting calculation
            const L = cosPhi * cosTheta * sinB
                    - cosA * cosTheta * sinPhi
                    - sinA * sinTheta
                    + cosB * (cosA * sinTheta - cosTheta * sinA * sinPhi);

            if (xp >= 0 && xp < cols && yp >= 0 && yp < rows) {
              if (ooz > zBuffer[yp][xp]) {
                zBuffer[yp][xp] = ooz;
                // Smooth luminance with ambient term
                luminance[yp][xp] = Math.max(0, L * 0.8 + 0.2);
              }
            }
          }
        }

        // Convert to ASCII with smooth gradients
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const L = luminance[row][col];
            let char = " ";
            let brightness = 0;

            if (L > 0) {
              // Smooth character selection
              const smoothL = ease.smoothstep(L);
              const charIndex = Math.floor(smoothL * (ASCII_GRADIENT.length - 1));
              char = ASCII_GRADIENT[clamp(charIndex, 0, ASCII_GRADIENT.length - 1)];
              brightness = smoothL;
            }

            gridRow.push({ char, brightness, colorIndex: Math.floor((row + col) * PHI) % 360 });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "cube": {
        // 3D cube with golden ratio nested cubes
        const rotX = actualRotX;
        const rotY = actualRotY;
        const rotZ = actualRotZ;

        // Multiple nested cubes at golden ratio scales
        const cubeScales = [1, PHI_INV, PHI_INV * PHI_INV];

        const charGrid: { char: string; z: number }[][] = [];
        for (let i = 0; i < rows; i++) {
          charGrid[i] = new Array(cols).fill(null).map(() => ({ char: " ", z: -Infinity }));
        }

        // Rotation matrix
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

        const rotate = (v: number[]): number[] => {
          let [x, y, z] = v;
          // X rotation
          let temp = y;
          y = y * cosX - z * sinX;
          z = temp * sinX + z * cosX;
          // Y rotation
          temp = x;
          x = x * cosY + z * sinY;
          z = -temp * sinY + z * cosY;
          // Z rotation
          temp = x;
          x = x * cosZ - y * sinZ;
          y = temp * sinZ + y * cosZ;
          return [x, y, z];
        };

        const project = (v: number[], scale: number): [number, number, number] => {
          const projScale = 15 * scale;
          const distance = 6;
          const factor = distance / (distance + v[2]);
          return [
            cols / 2 + v[0] * projScale * factor,
            rows / 2 + v[1] * projScale * factor * 0.5,
            v[2],
          ];
        };

        // Smooth line drawing with anti-aliasing concept
        const drawLine = (x0: number, y0: number, x1: number, y1: number, z: number, char: string, brightness: number) => {
          const dx = x1 - x0;
          const dy = y1 - y0;
          const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2;

          for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 0 : i / steps;
            const smoothT = ease.smoothstep(t);
            const x = Math.round(lerp(x0, x1, t));
            const y = Math.round(lerp(y0, y1, t));
            const currentZ = lerp(z, z, smoothT);

            if (x >= 0 && x < cols && y >= 0 && y < rows) {
              if (currentZ > charGrid[y][x].z) {
                charGrid[y][x] = { char, z: currentZ };
              }
            }
          }
        };

        // Draw cubes at different scales
        cubeScales.forEach((scale, scaleIdx) => {
          const vertices = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
          ].map(v => v.map(c => c * scale));

          const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7],
          ];

          // Draw edges
          for (const [i, j] of edges) {
            const v1 = rotate(vertices[i]);
            const v2 = rotate(vertices[j]);
            const [x1, y1, z1] = project(v1, 1);
            const [x2, y2, z2] = project(v2, 1);
            const avgZ = (z1 + z2) / 2;
            const edgeChar = avgZ > 0 ? "█" : "░";
            drawLine(x1, y1, x2, y2, avgZ, edgeChar, scaleIdx === 0 ? 1 : PHI_INV);
          }

          // Draw vertices
          for (const v of vertices) {
            const rotated = rotate(v);
            const [x, y, z] = project(rotated, 1);
            const xi = Math.round(x);
            const yi = Math.round(y);
            if (xi >= 0 && xi < cols && yi >= 0 && yi < rows && z > charGrid[yi][xi].z) {
              charGrid[yi][xi] = { char: "◆", z: z + 0.1 };
            }
          }
        });

        // Convert to grid format
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const cell = charGrid[row][col];
            const brightness = cell.char === " " ? 0 :
                             cell.char === "◆" ? 1 :
                             cell.char === "█" ? 0.9 : 0.5;
            gridRow.push({
              char: cell.char,
              brightness,
              colorIndex: Math.floor((row + col) * PHI * 10) % 360,
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "plasma": {
        // Plasma with golden ratio frequencies for non-repeating patterns
        const freqs = [1, PHI, PHI * PHI, PHI * PHI * PHI];

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const x = col / cols * 4;
            const y = row / rows * 4;

            // Golden ratio based frequencies create non-repeating patterns
            let value = 0;
            value += Math.sin(x * freqs[0] + time * 1.5) * 0.25;
            value += Math.sin(y * freqs[1] + time * 1.2) * 0.25;
            value += Math.sin((x + y) * freqs[2] * 0.5 + time * 0.8) * 0.25;

            // Radial component with golden angle
            const cx = x - 2, cy = y - 2;
            const dist = Math.sqrt(cx * cx + cy * cy);
            const angle = Math.atan2(cy, cx);
            value += Math.sin(dist * freqs[3] - time * 2 + angle * PHI) * 0.25;

            // FBM noise layer for organic feel
            value += fbm(x + time * 0.3, y + time * 0.2, seed, 3) * 0.3;

            // Normalize and smooth
            value = ease.smoothstep((value + 1) / 2);

            const charIndex = Math.floor(value * (ASCII_GRADIENT_LONG.length - 1));
            const char = ASCII_GRADIENT_LONG[clamp(charIndex, 0, ASCII_GRADIENT_LONG.length - 1)];

            gridRow.push({
              char,
              brightness: value,
              colorIndex: Math.floor(value * 360 + time * 30) % 360,
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "tunnel": {
        // Hypnotic tunnel with golden spiral influence
        const centerX = cols / 2;
        const centerY = rows / 2;

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const dx = (col - centerX) / cols;
            const dy = (row - centerY) / rows * 2;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Tunnel depth with smooth logarithmic scaling
            const depth = 1 / (distance + 0.1);
            const tunnelZ = depth * 0.5 + time * 2;

            // Golden angle based spiral arms
            const spiralArms = 5; // Fibonacci number
            const spiralAngle = angle * spiralArms + tunnelZ * PHI;

            // Multiple layers with golden ratio relationship
            let value = 0;
            value += Math.sin(spiralAngle) * 0.4;
            value += Math.sin(tunnelZ * PHI * 3) * 0.3;
            value += Math.sin(angle * 8 + tunnelZ) * 0.3;

            // Smooth radial falloff
            const radialFade = ease.smoothstep(clamp(distance * 3, 0, 1));
            value = (value + 1) / 2 * radialFade;

            // Center void
            const centerFade = ease.smoothstep(clamp(distance * 8, 0, 1));
            value *= centerFade;

            const charIndex = Math.floor(value * (ASCII_GRADIENT.length - 1));
            const char = ASCII_GRADIENT[clamp(charIndex, 0, ASCII_GRADIENT.length - 1)];

            gridRow.push({
              char,
              brightness: value,
              colorIndex: Math.floor((angle / TAU + 0.5) * 360 + tunnelZ * 20) % 360,
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "wave": {
        // 3D wave surface with golden ratio wave relationships
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const x = (col - cols / 2) / (cols / 8);
            const y = (row - rows / 2) / (rows / 4);

            // Multiple waves with golden ratio frequencies
            let z = 0;
            z += Math.sin(x * 1 + time * 2) * Math.cos(y * PHI_INV + time * 1.5) * 0.4;
            z += Math.sin(x * PHI + y * 1 - time * 1.8) * 0.3;

            // Radial wave
            const dist = Math.sqrt(x * x + y * y);
            z += Math.sin(dist * PHI - time * 2.5) * 0.3 / (dist * 0.3 + 1);

            // Calculate surface normal for lighting
            const eps = 0.1;
            const zx1 = Math.sin((x + eps) * 1 + time * 2) * Math.cos(y * PHI_INV + time * 1.5) * 0.4;
            const zx2 = Math.sin((x - eps) * 1 + time * 2) * Math.cos(y * PHI_INV + time * 1.5) * 0.4;
            const zy1 = Math.sin(x * 1 + time * 2) * Math.cos((y + eps) * PHI_INV + time * 1.5) * 0.4;
            const zy2 = Math.sin(x * 1 + time * 2) * Math.cos((y - eps) * PHI_INV + time * 1.5) * 0.4;

            const dzdx = (zx1 - zx2) / (2 * eps);
            const dzdy = (zy1 - zy2) / (2 * eps);

            // Normal vector (simplified)
            const normalMag = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
            const nz = 1 / normalMag;

            // Light from upper-front
            const light = clamp(nz * 0.7 + 0.3, 0, 1);

            // Height-based shading
            const heightShade = ease.smoothstep((z + 1) / 2);
            const brightness = heightShade * light;

            const charIndex = Math.floor(brightness * (ASCII_GRADIENT_LONG.length - 1));
            const char = ASCII_GRADIENT_LONG[clamp(charIndex, 0, ASCII_GRADIENT_LONG.length - 1)];

            gridRow.push({
              char,
              brightness,
              colorIndex: Math.floor((z + 1) * 180 + time * 20) % 360,
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "sphere": {
        // 3D sphere with Fibonacci lattice points for uniform distribution
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
              const pz = Math.sqrt(1 - r2);

              // Apply rotations
              let x1 = px;
              let y1 = py * Math.cos(rotX) - pz * Math.sin(rotX);
              let z1 = py * Math.sin(rotX) + pz * Math.cos(rotX);

              const finalX = x1 * Math.cos(rotY) + z1 * Math.sin(rotY);
              const finalY = y1;
              const finalZ = -x1 * Math.sin(rotY) + z1 * Math.cos(rotY);

              // Fibonacci spiral pattern on sphere (golden angle)
              const lat = Math.asin(clamp(finalY, -1, 1));
              const lon = Math.atan2(finalX, finalZ);

              // Golden spiral bands
              const spiralParam = lat / (Math.PI / 2) * 8;
              const spiralLon = lon + spiralParam * GOLDEN_ANGLE;
              const pattern = Math.sin(spiralLon * 5) * 0.5 + 0.5;

              // Latitude bands
              const latBands = Math.sin(lat * 13) * 0.3 + 0.7;

              // Improved lighting with fresnel-like edge glow
              const lightDir = [0.4, -0.3, 0.866];
              const dotProduct = finalX * lightDir[0] + finalY * lightDir[1] + finalZ * lightDir[2];
              const diffuse = clamp(dotProduct, 0, 1);

              // Fresnel edge highlight
              const viewDot = finalZ; // Simplified: viewer at +Z
              const fresnel = Math.pow(1 - Math.abs(viewDot), 2) * 0.3;

              brightness = ease.smoothstep(diffuse * 0.7 + 0.2 + fresnel) * pattern * latBands;

              const charIndex = Math.floor(brightness * (ASCII_GRADIENT.length - 1));
              char = ASCII_GRADIENT[clamp(charIndex, 0, ASCII_GRADIENT.length - 1)];
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
        // Golden spiral with hypnotic phyllotaxis pattern
        const centerX = cols / 2;
        const centerY = rows / 2;

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const dx = (col - centerX) / (cols / 2);
            const dy = (row - centerY) / (rows / 2) * 2;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Golden spiral formula: r = a * e^(b*theta)
            // where b = cot(golden angle)
            const goldenSpiral = distance * Math.exp(-0.3063 * (angle + time * 2));

            // Phyllotaxis pattern (sunflower seed arrangement)
            const n = 144; // Fibonacci number
            let closestDist = Infinity;

            for (let i = 1; i <= n; i++) {
              // Golden angle based positioning
              const theta = i * GOLDEN_ANGLE + time * 0.5;
              const r = 0.8 * Math.sqrt(i / n);
              const px = r * Math.cos(theta);
              const py = r * Math.sin(theta);
              const d = Math.sqrt((dx - px) ** 2 + (dy - py) ** 2);
              closestDist = Math.min(closestDist, d);
            }

            // Spiral arms
            const arms = 5; // Fibonacci
            const spiralAngle = angle * arms + distance * 3 - time * 3;
            const spiralValue = Math.sin(spiralAngle) * 0.5 + 0.5;

            // Combine patterns
            const seedPattern = ease.smoothstep(1 - clamp(closestDist * 15, 0, 1));
            const radialFade = ease.smoothstep(1 - clamp(distance, 0, 1));

            let brightness = (spiralValue * 0.6 + seedPattern * 0.4) * radialFade;

            // Add subtle rotation effect
            brightness *= 0.7 + 0.3 * Math.sin(goldenSpiral * 5 + time);

            const charIndex = Math.floor(brightness * (ASCII_GRADIENT_LONG.length - 1));
            const char = ASCII_GRADIENT_LONG[clamp(charIndex, 0, ASCII_GRADIENT_LONG.length - 1)];

            gridRow.push({
              char,
              brightness,
              colorIndex: Math.floor(((angle / TAU + 0.5) * 360 + time * 40) % 360),
            });
          }
          grid.push(gridRow);
        }
        break;
      }
    }

    return grid;
  }, [pattern, cols, rows, time, seed, actualRotX, actualRotY, actualRotZ]);

  // Get color for a cell with smooth gradients
  const getCellColor = (brightness: number, colorIndex: number): string => {
    if (colorMode === "green") {
      // Matrix green with subtle variation
      const smoothBright = ease.smoothstep(brightness);
      const green = Math.floor(80 + smoothBright * 175);
      const blue = Math.floor(smoothBright * 30);
      return `rgb(0, ${green}, ${blue})`;
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
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
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
                  opacity: ease.smoothstep(Math.max(0.05, cell.brightness)),
                  textShadow: cell.brightness > 0.6 && colorMode === "green"
                    ? `0 0 ${8 * cell.brightness}px rgba(0, 255, 50, ${cell.brightness * 0.6})`
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
      {enableNoise && <Noise opacity={0.06} animated />}
      {enableVignette && <Vignette intensity={0.5} />}

      {/* Subtle scanline effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.03) 0px,
            rgba(0, 0, 0, 0.03) 1px,
            transparent 1px,
            transparent 2px
          )`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

export default AsciiAnimation;
