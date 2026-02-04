// Color utilities for rainbow/chromatic effects

export interface RainbowConfig {
  hueStart: number;      // Starting hue (0-360)
  hueEnd: number;        // Ending hue (0-360)
  saturation: number;    // 0-100
  lightness: number;     // 0-100
  animate: boolean;      // Time-based hue cycling
  speed: number;         // Animation speed multiplier
}

export const defaultRainbowConfig: RainbowConfig = {
  hueStart: 0,
  hueEnd: 360,
  saturation: 80,
  lightness: 60,
  animate: true,
  speed: 1,
};

// Convert HSL to CSS string
export const hslToString = (
  h: number,
  s: number,
  l: number,
  a?: number
): string => {
  const hue = ((h % 360) + 360) % 360; // Normalize to 0-360
  return a !== undefined
    ? `hsla(${hue}, ${s}%, ${l}%, ${a})`
    : `hsl(${hue}, ${s}%, ${l}%)`;
};

// Get rainbow color for an indexed element
export const getRainbowColor = (
  index: number,
  total: number,
  config: RainbowConfig,
  frame: number,
  fps: number
): string => {
  const { hueStart, hueEnd, saturation, lightness, animate, speed } = config;

  // Calculate hue range (handle wrap-around)
  let hueRange = hueEnd - hueStart;
  if (hueRange < 0) hueRange += 360;

  // Base hue based on position in sequence
  const baseHue = hueStart + (index / Math.max(total - 1, 1)) * hueRange;

  // Add time-based animation
  const time = frame / fps;
  const animatedHue = animate
    ? baseHue + time * speed * 60
    : baseHue;

  return hslToString(animatedHue, saturation, lightness);
};

// Get color at a specific position (0-1) along a gradient
export const getGradientColorAtPosition = (
  position: number,
  colors: string[],
): string => {
  if (colors.length === 0) return "#ffffff";
  if (colors.length === 1) return colors[0];

  const clampedPos = Math.max(0, Math.min(1, position));
  const segment = clampedPos * (colors.length - 1);
  const index = Math.floor(segment);
  const t = segment - index;

  if (index >= colors.length - 1) return colors[colors.length - 1];

  // Simple color interpolation (works for hex colors)
  return interpolateHexColors(colors[index], colors[index + 1], t);
};

// Interpolate between two hex colors
export const interpolateHexColors = (
  color1: string,
  color2: string,
  t: number
): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return rgbToHex(r, g, b);
};

// Convert hex to RGB
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Convert RGB to hex
export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, x)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
};

// Generate an array of rainbow colors
export const generateRainbowPalette = (
  count: number,
  config: RainbowConfig = defaultRainbowConfig
): string[] => {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = config.hueStart + (i / count) * (config.hueEnd - config.hueStart);
    colors.push(hslToString(hue, config.saturation, config.lightness));
  }
  return colors;
};

// Preset color palettes
export const colorPresets = {
  rainbow: { hueStart: 0, hueEnd: 360, saturation: 80, lightness: 60 },
  sunset: { hueStart: 0, hueEnd: 60, saturation: 90, lightness: 55 },
  ocean: { hueStart: 180, hueEnd: 260, saturation: 70, lightness: 50 },
  forest: { hueStart: 80, hueEnd: 160, saturation: 60, lightness: 45 },
  neon: { hueStart: 280, hueEnd: 340, saturation: 100, lightness: 60 },
  fire: { hueStart: 0, hueEnd: 45, saturation: 100, lightness: 50 },
  ice: { hueStart: 180, hueEnd: 220, saturation: 60, lightness: 70 },
  cosmic: { hueStart: 260, hueEnd: 320, saturation: 80, lightness: 55 },
};
