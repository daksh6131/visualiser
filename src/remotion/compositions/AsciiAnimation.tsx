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
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  autoRotate?: boolean;
  autoRotateSpeedX?: number;
  autoRotateSpeedY?: number;
  autoRotateSpeedZ?: number;
}

// === MATHEMATICAL CONSTANTS ===
const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;

// === PERLIN NOISE IMPLEMENTATION ===
// Permutation table for Perlin noise
const permutation = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
  8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
  35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
  134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
  55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
  250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
  189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
  172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
  228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
  107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];

// Double the permutation table
const p: number[] = new Array(512);
for (let i = 0; i < 256; i++) {
  p[i] = permutation[i];
  p[256 + i] = permutation[i];
}

// Fade function for smooth interpolation (6t^5 - 15t^4 + 10t^3)
const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

// Linear interpolation
const lerp = (a: number, b: number, t: number): number => a + t * (b - a);

// Gradient function
const grad = (hash: number, x: number, y: number, z: number): number => {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
};

// 3D Perlin noise
const perlin3D = (x: number, y: number, z: number): number => {
  // Find unit cube containing point
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;

  // Find relative x, y, z in cube
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);

  // Compute fade curves
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);

  // Hash coordinates of cube corners
  const A = p[X] + Y;
  const AA = p[A] + Z;
  const AB = p[A + 1] + Z;
  const B = p[X + 1] + Y;
  const BA = p[B] + Z;
  const BB = p[B + 1] + Z;

  // Blend results from 8 corners
  return lerp(
    lerp(
      lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u),
      lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u),
      v
    ),
    lerp(
      lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
      lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u),
      v
    ),
    w
  );
};

// 2D Perlin noise (using z=0)
const perlin2D = (x: number, y: number): number => perlin3D(x, y, 0);

// Fractal Brownian Motion with Perlin noise
const fbm = (x: number, y: number, z: number, octaves: number = 4): number => {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * perlin3D(x * frequency, y * frequency, z * frequency);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
};

// Ridged noise (absolute value creates ridges)
const ridgedNoise = (x: number, y: number, z: number, octaves: number = 4): number => {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(perlin3D(x * frequency, y * frequency, z * frequency));
    value += amplitude * n * n;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
};

// Turbulence (absolute fbm)
const turbulence = (x: number, y: number, z: number, octaves: number = 4): number => {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * Math.abs(perlin3D(x * frequency, y * frequency, z * frequency));
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
};

// === EASING FUNCTIONS ===
const smoothstep = (t: number): number => t * t * (3 - 2 * t);
const smootherstep = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

// === UTILITY FUNCTIONS ===
const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const degToRad = (deg: number): number => (deg * Math.PI) / 180;

// Seeded random for deterministic results
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ASCII gradients
const ASCII_GRADIENT = " .:;+=xX$&";
const ASCII_GRADIENT_LONG = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const MATRIX_CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";

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

  // Calculate rotation angles
  const actualRotX = autoRotate
    ? degToRad(rotationX) + time * autoRotateSpeedX * 0.5
    : degToRad(rotationX);
  const actualRotY = autoRotate
    ? degToRad(rotationY) + time * autoRotateSpeedY * 0.5
    : degToRad(rotationY);
  const actualRotZ = autoRotate
    ? degToRad(rotationZ) + time * autoRotateSpeedZ * 0.3
    : degToRad(rotationZ);

  // Grid dimensions
  const baseCols = 120;
  const baseRows = 60;
  const cols = Math.floor(baseCols * density);
  const rows = Math.floor(baseRows * density);
  const charWidth = width / cols;
  const charHeight = height / rows;
  const fontSize = Math.min(charWidth, charHeight) * 1.1;

  // Generate ASCII grid
  const asciiGrid = useMemo(() => {
    const grid: { char: string; brightness: number; colorIndex: number }[][] = [];

    switch (pattern) {
      case "matrix": {
        // Matrix rain with Perlin-modulated trails
        const numColumns = cols;

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const colSeed = seededRandom(seed + col * 137);
            const dropSpeed = 0.5 + colSeed * 0.8;
            const dropLength = 8 + Math.floor(colSeed * 12);
            const dropOffset = colSeed * rows * 3;

            // Perlin-modulated drop position for organic flow
            const noiseOffset = perlin2D(col * 0.1, time * 0.5) * 3;
            const dropY = ((dropOffset + time * 15 * dropSpeed + noiseOffset) % (rows + dropLength + 5)) - dropLength;

            const distFromHead = row - dropY;
            let brightness = 0;
            let char = " ";

            if (distFromHead >= -0.5 && distFromHead < dropLength) {
              if (distFromHead < 0) {
                // Bright head
                brightness = 1.0;
              } else {
                // Smooth exponential falloff
                brightness = Math.exp(-distFromHead / (dropLength * 0.3));
              }

              // Character selection with time variation
              const charSeed = seed + row * numColumns + col + Math.floor(time * 8 * dropSpeed);
              char = MATRIX_CHARS[Math.floor(seededRandom(charSeed) * MATRIX_CHARS.length)];
            }

            gridRow.push({ char, brightness, colorIndex: col });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "donut": {
        // Classic donut.c algorithm with proper z-buffer
        const A = actualRotX;
        const B = actualRotY;

        const zBuffer: number[][] = [];
        const luminance: number[][] = [];

        for (let i = 0; i < rows; i++) {
          zBuffer[i] = new Array(cols).fill(0);
          luminance[i] = new Array(cols).fill(0);
        }

        // Torus parameters (R1=tube radius, R2=torus radius)
        const R1 = 1;
        const R2 = 2;
        const K2 = 5;
        const K1 = cols * K2 * 3 / (8 * (R1 + R2));

        // High-density sampling for smooth surface
        const thetaStep = 0.02;
        const phiStep = 0.007;

        for (let theta = 0; theta < TAU; theta += thetaStep) {
          const cosTheta = Math.cos(theta);
          const sinTheta = Math.sin(theta);

          for (let phi = 0; phi < TAU; phi += phiStep) {
            const cosPhi = Math.cos(phi);
            const sinPhi = Math.sin(phi);
            const cosA = Math.cos(A);
            const sinA = Math.sin(A);
            const cosB = Math.cos(B);
            const sinB = Math.sin(B);

            // Circle point
            const circleX = R2 + R1 * cosTheta;
            const circleY = R1 * sinTheta;

            // 3D coordinates after rotation
            const x = circleX * (cosB * cosPhi + sinA * sinB * sinPhi) - circleY * cosA * sinB;
            const y = circleX * (sinB * cosPhi - sinA * cosB * sinPhi) + circleY * cosA * cosB;
            const z = K2 + cosA * circleX * sinPhi + circleY * sinA;
            const ooz = 1 / z;

            // Project to screen
            const xp = Math.floor(cols / 2 + K1 * ooz * x);
            const yp = Math.floor(rows / 2 - K1 * ooz * y * 0.5);

            // Luminance calculation (light from direction 0,1,-1)
            const L = cosPhi * cosTheta * sinB
                    - cosA * cosTheta * sinPhi
                    - sinA * sinTheta
                    + cosB * (cosA * sinTheta - cosTheta * sinA * sinPhi);

            if (xp >= 0 && xp < cols && yp >= 0 && yp < rows) {
              if (ooz > zBuffer[yp][xp]) {
                zBuffer[yp][xp] = ooz;
                luminance[yp][xp] = Math.max(0, L);
              }
            }
          }
        }

        // Convert luminance to ASCII
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const L = luminance[row][col];
            let char = " ";
            let brightness = 0;

            if (L > 0) {
              brightness = L * 0.7 + 0.1;
              const charIndex = Math.floor(L * (ASCII_GRADIENT.length - 1));
              char = ASCII_GRADIENT[clamp(charIndex, 0, ASCII_GRADIENT.length - 1)];
            }

            gridRow.push({ char, brightness, colorIndex: Math.floor((row + col) * PHI) % 360 });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "cube": {
        // Wireframe cube with smooth lines
        const rotX = actualRotX;
        const rotY = actualRotY;
        const rotZ = actualRotZ;

        const charGrid: { char: string; brightness: number }[][] = [];
        for (let i = 0; i < rows; i++) {
          charGrid[i] = new Array(cols).fill(null).map(() => ({ char: " ", brightness: 0 }));
        }

        // Rotation functions
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
        const cosZ = Math.cos(rotZ), sinZ = Math.sin(rotZ);

        const rotate = (v: number[]): number[] => {
          let [x, y, z] = v;
          let temp = y;
          y = y * cosX - z * sinX;
          z = temp * sinX + z * cosX;
          temp = x;
          x = x * cosY + z * sinY;
          z = -temp * sinY + z * cosY;
          temp = x;
          x = x * cosZ - y * sinZ;
          y = temp * sinZ + y * cosZ;
          return [x, y, z];
        };

        const project = (v: number[]): [number, number, number] => {
          const scale = 18;
          const dist = 5;
          const factor = dist / (dist + v[2]);
          return [
            cols / 2 + v[0] * scale * factor,
            rows / 2 + v[1] * scale * factor * 0.5,
            v[2]
          ];
        };

        // Draw smooth line with anti-aliasing
        const drawLine = (x0: number, y0: number, x1: number, y1: number, z: number) => {
          const dx = x1 - x0;
          const dy = y1 - y0;
          const steps = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 2);

          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x0 + dx * t;
            const y = y0 + dy * t;
            const xi = Math.round(x);
            const yi = Math.round(y);

            if (xi >= 0 && xi < cols && yi >= 0 && yi < rows) {
              const brightness = z > 0 ? 1 : 0.4;
              if (brightness > charGrid[yi][xi].brightness) {
                charGrid[yi][xi] = { char: z > 0 ? "█" : "░", brightness };
              }
            }
          }
        };

        // Cube vertices
        const vertices = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
        ];

        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0],
          [4, 5], [5, 6], [6, 7], [7, 4],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ];

        // Draw all edges
        for (const [i, j] of edges) {
          const v1 = rotate(vertices[i]);
          const v2 = rotate(vertices[j]);
          const [x1, y1, z1] = project(v1);
          const [x2, y2, z2] = project(v2);
          drawLine(x1, y1, x2, y2, (z1 + z2) / 2);
        }

        // Draw vertices
        for (const v of vertices) {
          const rotated = rotate(v);
          const [x, y, z] = project(rotated);
          const xi = Math.round(x);
          const yi = Math.round(y);
          if (xi >= 0 && xi < cols && yi >= 0 && yi < rows) {
            charGrid[yi][xi] = { char: "●", brightness: 1 };
          }
        }

        // Convert to grid
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const cell = charGrid[row][col];
            gridRow.push({
              char: cell.char,
              brightness: cell.brightness,
              colorIndex: (row + col) % 360,
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "plasma": {
        // Smooth plasma using Perlin noise
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const x = col / cols * 4;
            const y = row / rows * 4;

            // Multiple layers of Perlin noise
            let value = 0;

            // Base plasma waves
            value += perlin3D(x * 2, y * 2, time * 0.8) * 0.5;
            value += perlin3D(x * 4 + 100, y * 4, time * 0.5) * 0.25;
            value += perlin3D(x * 8, y * 8 + 100, time * 0.3) * 0.125;

            // Radial component
            const cx = x - 2, cy = y - 2;
            const dist = Math.sqrt(cx * cx + cy * cy);
            value += Math.sin(dist * 3 - time * 2) * 0.3;

            // Normalize to 0-1
            value = smoothstep((value + 1) / 2);
            value = clamp(value, 0, 1);

            const charIndex = Math.floor(value * (ASCII_GRADIENT_LONG.length - 1));
            const char = ASCII_GRADIENT_LONG[charIndex];

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
        // Hypnotic tunnel with Perlin distortion
        const centerX = cols / 2;
        const centerY = rows / 2;

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const dx = (col - centerX) / (cols / 2);
            const dy = (row - centerY) / (rows / 2) * 1.8;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Perlin-distorted tunnel
            const noiseAngle = perlin3D(dx * 2, dy * 2, time * 0.5) * 0.5;
            const noiseDist = perlin3D(dx * 3 + 100, dy * 3, time * 0.3) * 0.2;

            const distortedAngle = angle + noiseAngle;
            const distortedDist = distance + noiseDist;

            // Tunnel depth
            const depth = 1 / (distortedDist + 0.15);
            const tunnelZ = depth + time * 3;

            // Ring pattern
            const rings = Math.sin(tunnelZ * 4) * 0.5 + 0.5;
            const arms = Math.sin(distortedAngle * 6 + tunnelZ * 2) * 0.5 + 0.5;

            let value = rings * 0.6 + arms * 0.4;

            // Radial falloff
            value *= smoothstep(clamp(distortedDist * 1.5, 0, 1));
            // Center void
            value *= smoothstep(clamp(distortedDist * 6, 0, 1));

            const charIndex = Math.floor(value * (ASCII_GRADIENT.length - 1));
            const char = ASCII_GRADIENT[clamp(charIndex, 0, ASCII_GRADIENT.length - 1)];

            gridRow.push({
              char,
              brightness: value,
              colorIndex: Math.floor((distortedAngle / TAU + 0.5) * 360 + tunnelZ * 15) % 360,
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "wave": {
        // 3D wave surface with Perlin modulation
        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const x = (col - cols / 2) / (cols / 6);
            const y = (row - rows / 2) / (rows / 3);

            // Base waves
            let z = Math.sin(x * 1.5 + time * 2) * Math.cos(y * 1.2 + time * 1.5) * 0.5;

            // Add Perlin noise for organic feel
            z += perlin3D(x * 0.5, y * 0.5, time * 0.3) * 0.4;
            z += fbm(x * 0.3, y * 0.3, time * 0.2, 3) * 0.3;

            // Radial ripple
            const dist = Math.sqrt(x * x + y * y);
            z += Math.sin(dist * 2 - time * 2.5) * 0.2 / (dist * 0.5 + 1);

            // Simple lighting based on gradient
            const eps = 0.1;
            const zx = Math.sin((x + eps) * 1.5 + time * 2) - Math.sin((x - eps) * 1.5 + time * 2);
            const zy = Math.cos((y + eps) * 1.2 + time * 1.5) - Math.cos((y - eps) * 1.2 + time * 1.5);
            const light = clamp(0.5 + (zx + zy) * 2, 0, 1);

            const brightness = smoothstep((z + 1) / 2) * light;

            const charIndex = Math.floor(brightness * (ASCII_GRADIENT_LONG.length - 1));
            const char = ASCII_GRADIENT_LONG[clamp(charIndex, 0, ASCII_GRADIENT_LONG.length - 1)];

            gridRow.push({
              char,
              brightness,
              colorIndex: Math.floor((z + 1) * 180 + time * 15) % 360,
            });
          }
          grid.push(gridRow);
        }
        break;
      }

      case "sphere": {
        // 3D sphere with proper lighting
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

              // Perlin noise texture on sphere
              const u = Math.atan2(finalX, finalZ) / Math.PI;
              const v = Math.asin(clamp(finalY, -1, 1)) / (Math.PI / 2);
              const noiseVal = perlin3D(u * 4, v * 4, time * 0.3) * 0.3 + 0.7;

              // Lighting
              const lightDir = [0.5, -0.3, 0.8];
              const mag = Math.sqrt(lightDir[0]**2 + lightDir[1]**2 + lightDir[2]**2);
              const diffuse = clamp((finalX * lightDir[0] + finalY * lightDir[1] + finalZ * lightDir[2]) / mag, 0, 1);

              // Fresnel edge
              const fresnel = Math.pow(1 - Math.abs(finalZ), 3) * 0.3;

              brightness = (diffuse * 0.7 + 0.2 + fresnel) * noiseVal;

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
        // Hypnotic spiral with Perlin flow
        const centerX = cols / 2;
        const centerY = rows / 2;

        for (let row = 0; row < rows; row++) {
          const gridRow: { char: string; brightness: number; colorIndex: number }[] = [];
          for (let col = 0; col < cols; col++) {
            const dx = (col - centerX) / (cols / 2);
            const dy = (row - centerY) / (rows / 2) * 1.8;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Perlin flow field distortion
            const flowX = perlin3D(dx * 2, dy * 2, time * 0.3);
            const flowY = perlin3D(dx * 2 + 100, dy * 2, time * 0.3);
            const distortedAngle = angle + flowX * 0.5;
            const distortedDist = distance + flowY * 0.1;

            // Multiple spiral arms
            const arms = 5;
            const spiralAngle = distortedAngle * arms + distortedDist * 6 - time * 3;
            const spiralValue = Math.sin(spiralAngle) * 0.5 + 0.5;

            // Turbulent detail
            const turbVal = turbulence(dx * 3, dy * 3, time * 0.5, 3);

            // Combine
            let value = spiralValue * 0.7 + turbVal * 0.3;
            value *= smoothstep(1 - clamp(distortedDist, 0, 1));

            const charIndex = Math.floor(value * (ASCII_GRADIENT_LONG.length - 1));
            const char = ASCII_GRADIENT_LONG[clamp(charIndex, 0, ASCII_GRADIENT_LONG.length - 1)];

            gridRow.push({
              char,
              brightness: value,
              colorIndex: Math.floor((distortedAngle / TAU + 0.5) * 360 + time * 30) % 360,
            });
          }
          grid.push(gridRow);
        }
        break;
      }
    }

    return grid;
  }, [pattern, cols, rows, time, seed, actualRotX, actualRotY, actualRotZ]);

  // Color calculation
  const getCellColor = (brightness: number, colorIndex: number): string => {
    if (colorMode === "green") {
      const g = Math.floor(60 + smoothstep(brightness) * 195);
      return `rgb(0, ${g}, ${Math.floor(g * 0.15)})`;
    } else if (colorMode === "rainbow") {
      return getRainbowColor(colorIndex, 360, rainbowConfig, frame, fps);
    }
    return textColor;
  };

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
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
                  opacity: clamp(cell.brightness * 1.2, 0.05, 1),
                  textShadow: cell.brightness > 0.5 && colorMode === "green"
                    ? `0 0 ${6 * cell.brightness}px rgba(0, 255, 40, ${cell.brightness * 0.5})`
                    : "none",
                }}
              >
                {cell.char}
              </span>
            ))}
          </div>
        ))}
      </div>

      {enableNoise && <Noise opacity={0.05} animated />}
      {enableVignette && <Vignette intensity={0.4} />}

      {/* Subtle scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.02) 0px,
            rgba(0, 0, 0, 0.02) 1px,
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
