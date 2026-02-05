"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
// Direct canvas components for 60fps performance
import { ShaderCanvas, ShaderCanvasHandle } from "@/components/ShaderCanvas";
import { TunnelCanvas, TunnelCanvasHandle } from "@/components/TunnelCanvas";
import { WaveCanvas, WaveCanvasHandle } from "@/components/WaveCanvas";
import { AsciiCanvas, AsciiCanvasHandle } from "@/components/AsciiCanvas";
import { IsometricCanvas, IsometricCanvasHandle } from "@/components/IsometricCanvas";
import { DownloadButton } from "@/components/DownloadButton";

// Design state interface for save/load
interface DesignState {
  // Type
  t: string;
  // Shared
  s: number; // seed
  n: number; // enableNoise (0/1)
  v: number; // enableVignette (0/1)
  // Rainbow
  hs: number; // hueStart
  he: number; // hueEnd
  sat: number; // saturation
  lit: number; // lightness
  // ASCII
  ap?: string; // asciiPattern
  as?: number; // asciiSpeed
  ad?: number; // asciiDensity
  acm?: string; // asciiColorMode
  ac?: string; // asciiColor
  rx?: number; // rotationX
  ry?: number; // rotationY
  rz?: number; // rotationZ
  ar?: number; // autoRotate (0/1)
  arx?: number; // autoRotateSpeedX
  ary?: number; // autoRotateSpeedY
  arz?: number; // autoRotateSpeedZ
  // Wave
  wp?: string; // wavePattern
  wl?: number; // lineCount
  wa?: number; // waveAmplitude
  wf?: number; // waveFrequency
  ws?: number; // waveSpeed
  wpe?: number; // wavePerspective
  wcm?: string; // waveColorMode
  wc?: string; // waveColor
  // Tunnel
  ts?: string; // tunnelShape
  tp?: string; // tunnelPatternType
  zs?: number; // zoomSpeed
  zd?: string; // zoomDirection
  lc?: number; // layerCount
  tr?: number; // tunnelRotation
  eg?: number; // enableGlow (0/1)
  gi?: number; // glowIntensity
  // Shader
  sp?: string; // shaderPattern
  ss?: number; // shaderSpeed
  sco?: number; // shaderComplexity
  sca?: string; // shaderColorA
  scb?: string; // shaderColorB
  scc?: string; // shaderColorC
  ssy?: number; // shaderSymmetry
  sz?: number; // shaderZoom
  sr?: number; // shaderRotation
  // Isometric
  ip?: string; // isometricPattern
  igs?: number; // gridSize
  ics?: number; // cubeSize
  ihs?: number; // heightScale
  isp?: number; // speed
  ins?: number; // noiseScale
  ibc?: string; // baseColor
  isc?: string; // strokeColor
  isw?: number; // strokeWidth
  icm?: string; // colorMode
  its?: number; // topShade
  ils?: number; // leftShade
  irs?: number; // rightShade
  ieg?: number; // enableGlow (0/1)
  igi?: number; // glowIntensity
  iro?: number; // rotation
  iar?: number; // autoRotate (0/1)
  iars?: number; // autoRotateSpeed
}

// Encode design state to URL-safe string
const encodeDesign = (state: DesignState): string => {
  return btoa(JSON.stringify(state)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Decode URL-safe string to design state
const decodeDesign = (encoded: string): DesignState | null => {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (padded.length % 4)) % 4;
    const base64 = padded + '='.repeat(padding);
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

// Reusable slider with input component
interface SliderWithInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  decimals?: number;
}

const SliderWithInput = ({ label, value, onChange, min, max, step, decimals = 1 }: SliderWithInputProps) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label className="text-xs text-neutral-400">{label}</Label>
      <Input
        type="number"
        value={decimals === 0 ? Math.round(value) : value.toFixed(decimals)}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        min={min}
        max={max}
        step={step}
        className="h-6 w-16 text-xs text-right bg-neutral-800 border-neutral-700 text-neutral-200 px-2"
      />
    </div>
    <Slider
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={min}
      max={max}
      step={step}
    />
  </div>
);

// Pattern options
const asciiPatterns = [
  { value: "donut", label: "Donut" },
  { value: "matrix", label: "Matrix" },
  { value: "cube", label: "Cube" },
  { value: "sphere", label: "Sphere" },
  { value: "plasma", label: "Plasma" },
  { value: "tunnel", label: "Tunnel" },
  { value: "wave", label: "Wave" },
  { value: "spiral", label: "Spiral" },
  { value: "fire", label: "Fire" },
  { value: "rain", label: "Rain" },
  { value: "starfield", label: "Starfield" },
  { value: "image", label: "Image" },
];

const asciiColorModes = [
  { value: "green", label: "Matrix Green" },
  { value: "single", label: "Custom" },
  { value: "rainbow", label: "Rainbow" },
  { value: "grayscale", label: "Grayscale" },
  { value: "neon", label: "Neon" },
];

const asciiCharacterSets = [
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
  { value: "blocks", label: "Blocks" },
  { value: "binary", label: "Binary" },
  { value: "minimal", label: "Minimal" },
  { value: "braille", label: "Braille" },
  { value: "japanese", label: "Japanese" },
  { value: "arrows", label: "Arrows" },
  { value: "custom", label: "Custom" },
];

const asciiFontFamilies = [
  { value: "monospace", label: "Monospace" },
  { value: "courier", label: "Courier" },
  { value: "consolas", label: "Consolas" },
  { value: "firacode", label: "Fira Code" },
  { value: "jetbrains", label: "JetBrains" },
];

const asciiRenderModes = [
  { value: "normal", label: "Normal" },
  { value: "edges", label: "Edge Detect" },
  { value: "dither", label: "Dither" },
  { value: "contrast", label: "High Contrast" },
];

const wavePatterns = [
  { value: "waves", label: "Waves" },
  { value: "spiral", label: "Spiral" },
  { value: "vortex", label: "Vortex" },
  { value: "terrain", label: "Terrain" },
  { value: "ripple", label: "Ripple" },
  { value: "fabric", label: "Fabric" },
];

const tunnelShapes = [
  { value: "circle", label: "Circle" },
  { value: "triangle", label: "Triangle" },
  { value: "square", label: "Square" },
  { value: "hexagon", label: "Hexagon" },
  { value: "star", label: "Star" },
];

const tunnelPatternTypes = [
  { value: "concentric", label: "Concentric" },
  { value: "starburst", label: "Starburst" },
];

const shaderPatterns = [
  { value: "psychedelic", label: "Psychedelic" },
  { value: "vortex", label: "Vortex" },
  { value: "diagonalWaves", label: "Diagonal Waves" },
  { value: "hypnotic", label: "Hypnotic" },
  { value: "voronoi", label: "Voronoi" },
  { value: "kaleidoscope", label: "Kaleidoscope" },
  { value: "plasma", label: "Plasma" },
  { value: "tunnel", label: "Tunnel" },
  { value: "fractal", label: "Fractal" },
  { value: "moire", label: "Moiré" },
  { value: "waves", label: "Waves" },
];

const isometricPatterns = [
  { value: "noise", label: "Noise Terrain" },
  { value: "radial", label: "Radial Wave" },
  { value: "pyramid", label: "Pyramid" },
  { value: "waves", label: "Waves" },
  { value: "ripple", label: "Ripple" },
  { value: "terrain", label: "Terrain" },
];

const isometricColorModes = [
  { value: "single", label: "Single Color" },
  { value: "rainbow", label: "Rainbow" },
  { value: "height", label: "Height Map" },
  { value: "gradient", label: "Gradient" },
];

type AnimationType = "wavefield" | "ascii" | "tunnel" | "shader" | "isometric";

export default function Home() {
  const [type, setType] = useState<AnimationType>("shader");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Canvas refs for video recording
  const shaderCanvasRef = useRef<ShaderCanvasHandle>(null);
  const tunnelCanvasRef = useRef<TunnelCanvasHandle>(null);
  const waveCanvasRef = useRef<WaveCanvasHandle>(null);
  const asciiCanvasRef = useRef<AsciiCanvasHandle>(null);
  const isometricCanvasRef = useRef<IsometricCanvasHandle>(null);

  // Get the currently active canvas element
  const getActiveCanvas = useCallback(() => {
    switch (type) {
      case "shader":
        return shaderCanvasRef.current?.getCanvas() ?? null;
      case "tunnel":
        return tunnelCanvasRef.current?.getCanvas() ?? null;
      case "wavefield":
        return waveCanvasRef.current?.getCanvas() ?? null;
      case "ascii":
        return asciiCanvasRef.current?.getCanvas() ?? null;
      case "isometric":
        return isometricCanvasRef.current?.getCanvas() ?? null;
      default:
        return null;
    }
  }, [type]);

  // Create a ref that always points to the active canvas
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update the active canvas ref when type changes or components mount
  const updateActiveCanvasRef = useCallback(() => {
    activeCanvasRef.current = getActiveCanvas();
  }, [getActiveCanvas]);

  // Use effect to update active canvas ref
  useEffect(() => {
    // Small delay to ensure canvas is mounted
    const timer = setTimeout(updateActiveCanvasRef, 100);
    return () => clearTimeout(timer);
  }, [type, updateActiveCanvasRef]);

  // Shared
  const [seed, setSeed] = useState(42);
  const [enableNoise, setEnableNoise] = useState(true);
  const [enableVignette, setEnableVignette] = useState(true);

  // ASCII
  const [asciiPattern, setAsciiPattern] = useState("donut");
  const [asciiSpeed, setAsciiSpeed] = useState(1);
  const [asciiDensity, setAsciiDensity] = useState(1);
  const [asciiColorMode, setAsciiColorMode] = useState("green");
  const [asciiColor, setAsciiColor] = useState("#00ff00");
  // 3D Rotation controls
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [rotationZ, setRotationZ] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [autoRotateSpeedX, setAutoRotateSpeedX] = useState(0.5);
  const [autoRotateSpeedY, setAutoRotateSpeedY] = useState(1);
  const [autoRotateSpeedZ, setAutoRotateSpeedZ] = useState(0);
  // Image-to-ASCII controls
  const [asciiImageData, setAsciiImageData] = useState<string | undefined>(undefined);
  const [asciiImageInvert, setAsciiImageInvert] = useState(false);
  const [asciiImageAnimate, setAsciiImageAnimate] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // New granular ASCII controls
  const [asciiCellSize, setAsciiCellSize] = useState(14);
  const [asciiCharacterSet, setAsciiCharacterSet] = useState("standard");
  const [asciiCustomChars, setAsciiCustomChars] = useState("");
  const [asciiFontFamily, setAsciiFontFamily] = useState("monospace");
  const [asciiCharSpacingX, setAsciiCharSpacingX] = useState(0.6);
  const [asciiCharSpacingY, setAsciiCharSpacingY] = useState(1.0);
  const [asciiContrast, setAsciiContrast] = useState(1);
  const [asciiBrightness, setAsciiBrightness] = useState(0);
  const [asciiBgOpacity, setAsciiBgOpacity] = useState(0.9);
  const [asciiRenderMode, setAsciiRenderMode] = useState("normal");
  const [asciiGlowEffect, setAsciiGlowEffect] = useState(false);
  const [asciiGlowIntensity, setAsciiGlowIntensity] = useState(1);
  const [asciiScanlines, setAsciiScanlines] = useState(false);
  const [asciiChromatic, setAsciiChromatic] = useState(false);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAsciiImageData(result);
      setAsciiPattern('image'); // Auto-switch to image pattern
    };
    reader.readAsDataURL(file);
  }, []);

  // Wave
  const [wavePattern, setWavePattern] = useState("vortex");
  const [lineCount, setLineCount] = useState(40);
  const [waveAmplitude, setWaveAmplitude] = useState(50);
  const [waveFrequency, setWaveFrequency] = useState(3);
  const [waveSpeed, setWaveSpeed] = useState(1);
  const [wavePerspective, setWavePerspective] = useState(0.6);
  const [waveColorMode, setWaveColorMode] = useState("rainbow");
  const [waveColor, setWaveColor] = useState("#ffffff");

  // Tunnel
  const [tunnelShape, setTunnelShape] = useState("circle");
  const [tunnelPatternType, setTunnelPatternType] = useState("concentric");
  const [zoomSpeed, setZoomSpeed] = useState(1);
  const [zoomDirection, setZoomDirection] = useState("in");
  const [layerCount, setLayerCount] = useState(30);
  const [tunnelRotation, setTunnelRotation] = useState(0.2);
  const [enableGlow, setEnableGlow] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(1);

  // Shader
  const [shaderPattern, setShaderPattern] = useState("psychedelic");
  const [shaderSpeed, setShaderSpeed] = useState(1);
  const [shaderComplexity, setShaderComplexity] = useState(1);
  const [shaderColorA, setShaderColorA] = useState("#00ffff");
  const [shaderColorB, setShaderColorB] = useState("#ff0066");
  const [shaderColorC, setShaderColorC] = useState("#000000");
  const [shaderSymmetry, setShaderSymmetry] = useState(3);
  const [shaderZoom, setShaderZoom] = useState(1);
  const [shaderRotation, setShaderRotation] = useState(0);

  // Isometric
  const [isometricPattern, setIsometricPattern] = useState("noise");
  const [isometricGridSize, setIsometricGridSize] = useState(12);
  const [isometricCubeSize, setIsometricCubeSize] = useState(30);
  const [isometricHeightScale, setIsometricHeightScale] = useState(1.5);
  const [isometricSpeed, setIsometricSpeed] = useState(0.8);
  const [isometricNoiseScale, setIsometricNoiseScale] = useState(2);
  const [isometricBaseColor, setIsometricBaseColor] = useState("#3366ff");
  const [isometricStrokeColor, setIsometricStrokeColor] = useState("#6699ff");
  const [isometricStrokeWidth, setIsometricStrokeWidth] = useState(1);
  const [isometricColorMode, setIsometricColorMode] = useState("single");
  const [isometricTopShade, setIsometricTopShade] = useState(1.2);
  const [isometricLeftShade, setIsometricLeftShade] = useState(0.8);
  const [isometricRightShade, setIsometricRightShade] = useState(0.5);
  const [isometricEnableGlow, setIsometricEnableGlow] = useState(false);
  const [isometricGlowIntensity, setIsometricGlowIntensity] = useState(1);
  const [isometricRotation, setIsometricRotation] = useState(0);
  const [isometricAutoRotate, setIsometricAutoRotate] = useState(false);
  const [isometricAutoRotateSpeed, setIsometricAutoRotateSpeed] = useState(0.3);

  // Rainbow config
  const [hueStart, setHueStart] = useState(0);
  const [hueEnd, setHueEnd] = useState(360);
  const [saturation, setSaturation] = useState(80);
  const [lightness, setLightness] = useState(60);

  // Share link copied state
  const [linkCopied, setLinkCopied] = useState(false);

  // Load design from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const designParam = params.get('d');

    if (designParam) {
      const state = decodeDesign(designParam);
      if (state) {
        // Type
        if (state.t) setType(state.t as AnimationType);
        // Shared
        if (state.s !== undefined) setSeed(state.s);
        if (state.n !== undefined) setEnableNoise(state.n === 1);
        if (state.v !== undefined) setEnableVignette(state.v === 1);
        // Rainbow
        if (state.hs !== undefined) setHueStart(state.hs);
        if (state.he !== undefined) setHueEnd(state.he);
        if (state.sat !== undefined) setSaturation(state.sat);
        if (state.lit !== undefined) setLightness(state.lit);
        // ASCII
        if (state.ap) setAsciiPattern(state.ap);
        if (state.as !== undefined) setAsciiSpeed(state.as);
        if (state.ad !== undefined) setAsciiDensity(state.ad);
        if (state.acm) setAsciiColorMode(state.acm);
        if (state.ac) setAsciiColor(state.ac);
        if (state.rx !== undefined) setRotationX(state.rx);
        if (state.ry !== undefined) setRotationY(state.ry);
        if (state.rz !== undefined) setRotationZ(state.rz);
        if (state.ar !== undefined) setAutoRotate(state.ar === 1);
        if (state.arx !== undefined) setAutoRotateSpeedX(state.arx);
        if (state.ary !== undefined) setAutoRotateSpeedY(state.ary);
        if (state.arz !== undefined) setAutoRotateSpeedZ(state.arz);
        // Wave
        if (state.wp) setWavePattern(state.wp);
        if (state.wl !== undefined) setLineCount(state.wl);
        if (state.wa !== undefined) setWaveAmplitude(state.wa);
        if (state.wf !== undefined) setWaveFrequency(state.wf);
        if (state.ws !== undefined) setWaveSpeed(state.ws);
        if (state.wpe !== undefined) setWavePerspective(state.wpe);
        if (state.wcm) setWaveColorMode(state.wcm);
        if (state.wc) setWaveColor(state.wc);
        // Tunnel
        if (state.ts) setTunnelShape(state.ts);
        if (state.tp) setTunnelPatternType(state.tp);
        if (state.zs !== undefined) setZoomSpeed(state.zs);
        if (state.zd) setZoomDirection(state.zd);
        if (state.lc !== undefined) setLayerCount(state.lc);
        if (state.tr !== undefined) setTunnelRotation(state.tr);
        if (state.eg !== undefined) setEnableGlow(state.eg === 1);
        if (state.gi !== undefined) setGlowIntensity(state.gi);
        // Shader
        if (state.sp) setShaderPattern(state.sp);
        if (state.ss !== undefined) setShaderSpeed(state.ss);
        if (state.sco !== undefined) setShaderComplexity(state.sco);
        if (state.sca) setShaderColorA(state.sca);
        if (state.scb) setShaderColorB(state.scb);
        if (state.scc) setShaderColorC(state.scc);
        if (state.ssy !== undefined) setShaderSymmetry(state.ssy);
        if (state.sz !== undefined) setShaderZoom(state.sz);
        if (state.sr !== undefined) setShaderRotation(state.sr);
        // Isometric
        if (state.ip) setIsometricPattern(state.ip);
        if (state.igs !== undefined) setIsometricGridSize(state.igs);
        if (state.ics !== undefined) setIsometricCubeSize(state.ics);
        if (state.ihs !== undefined) setIsometricHeightScale(state.ihs);
        if (state.isp !== undefined) setIsometricSpeed(state.isp);
        if (state.ins !== undefined) setIsometricNoiseScale(state.ins);
        if (state.ibc) setIsometricBaseColor(state.ibc);
        if (state.isc) setIsometricStrokeColor(state.isc);
        if (state.isw !== undefined) setIsometricStrokeWidth(state.isw);
        if (state.icm) setIsometricColorMode(state.icm);
        if (state.its !== undefined) setIsometricTopShade(state.its);
        if (state.ils !== undefined) setIsometricLeftShade(state.ils);
        if (state.irs !== undefined) setIsometricRightShade(state.irs);
        if (state.ieg !== undefined) setIsometricEnableGlow(state.ieg === 1);
        if (state.igi !== undefined) setIsometricGlowIntensity(state.igi);
        if (state.iro !== undefined) setIsometricRotation(state.iro);
        if (state.iar !== undefined) setIsometricAutoRotate(state.iar === 1);
        if (state.iars !== undefined) setIsometricAutoRotateSpeed(state.iars);
      }
    }
  }, []);

  // Generate shareable URL
  const getShareUrl = useCallback(() => {
    const state: DesignState = {
      t: type,
      s: seed,
      n: enableNoise ? 1 : 0,
      v: enableVignette ? 1 : 0,
      hs: hueStart,
      he: hueEnd,
      sat: saturation,
      lit: lightness,
    };

    // Add type-specific state
    if (type === 'ascii') {
      state.ap = asciiPattern;
      state.as = asciiSpeed;
      state.ad = asciiDensity;
      state.acm = asciiColorMode;
      state.ac = asciiColor;
      state.rx = rotationX;
      state.ry = rotationY;
      state.rz = rotationZ;
      state.ar = autoRotate ? 1 : 0;
      state.arx = autoRotateSpeedX;
      state.ary = autoRotateSpeedY;
      state.arz = autoRotateSpeedZ;
    } else if (type === 'wavefield') {
      state.wp = wavePattern;
      state.wl = lineCount;
      state.wa = waveAmplitude;
      state.wf = waveFrequency;
      state.ws = waveSpeed;
      state.wpe = wavePerspective;
      state.wcm = waveColorMode;
      state.wc = waveColor;
    } else if (type === 'tunnel') {
      state.ts = tunnelShape;
      state.tp = tunnelPatternType;
      state.zs = zoomSpeed;
      state.zd = zoomDirection;
      state.lc = layerCount;
      state.tr = tunnelRotation;
      state.eg = enableGlow ? 1 : 0;
      state.gi = glowIntensity;
    } else if (type === 'shader') {
      state.sp = shaderPattern;
      state.ss = shaderSpeed;
      state.sco = shaderComplexity;
      state.sca = shaderColorA;
      state.scb = shaderColorB;
      state.scc = shaderColorC;
      state.ssy = shaderSymmetry;
      state.sz = shaderZoom;
      state.sr = shaderRotation;
    } else if (type === 'isometric') {
      state.ip = isometricPattern;
      state.igs = isometricGridSize;
      state.ics = isometricCubeSize;
      state.ihs = isometricHeightScale;
      state.isp = isometricSpeed;
      state.ins = isometricNoiseScale;
      state.ibc = isometricBaseColor;
      state.isc = isometricStrokeColor;
      state.isw = isometricStrokeWidth;
      state.icm = isometricColorMode;
      state.its = isometricTopShade;
      state.ils = isometricLeftShade;
      state.irs = isometricRightShade;
      state.ieg = isometricEnableGlow ? 1 : 0;
      state.igi = isometricGlowIntensity;
      state.iro = isometricRotation;
      state.iar = isometricAutoRotate ? 1 : 0;
      state.iars = isometricAutoRotateSpeed;
    }

    const encoded = encodeDesign(state);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    return `${baseUrl}?d=${encoded}`;
  }, [
    type, seed, enableNoise, enableVignette, hueStart, hueEnd, saturation, lightness,
    asciiPattern, asciiSpeed, asciiDensity, asciiColorMode, asciiColor,
    rotationX, rotationY, rotationZ, autoRotate, autoRotateSpeedX, autoRotateSpeedY, autoRotateSpeedZ,
    wavePattern, lineCount, waveAmplitude, waveFrequency, waveSpeed, wavePerspective, waveColorMode, waveColor,
    tunnelShape, tunnelPatternType, zoomSpeed, zoomDirection, layerCount, tunnelRotation, enableGlow, glowIntensity,
    shaderPattern, shaderSpeed, shaderComplexity, shaderColorA, shaderColorB, shaderColorC, shaderSymmetry, shaderZoom, shaderRotation,
    isometricPattern, isometricGridSize, isometricCubeSize, isometricHeightScale, isometricSpeed, isometricNoiseScale,
    isometricBaseColor, isometricStrokeColor, isometricStrokeWidth, isometricColorMode,
    isometricTopShade, isometricLeftShade, isometricRightShade, isometricEnableGlow, isometricGlowIntensity,
    isometricRotation, isometricAutoRotate, isometricAutoRotateSpeed
  ]);

  // Copy share link to clipboard
  const copyShareLink = useCallback(async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      // Also update URL without reload
      window.history.replaceState({}, '', url);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [getShareUrl]);

  const randomize = () => {
    setSeed(Math.floor(Math.random() * 10000));

    if (type === "ascii") {
      // Don't randomize to "image" pattern
      const nonImagePatterns = asciiPatterns.filter(p => p.value !== "image");
      setAsciiPattern(nonImagePatterns[Math.floor(Math.random() * nonImagePatterns.length)].value);
      setAsciiSpeed(0.5 + Math.random() * 2);
      setAsciiDensity(0.7 + Math.random() * 0.8);
      setAsciiColorMode(asciiColorModes[Math.floor(Math.random() * asciiColorModes.length)].value);
      // Character set (exclude custom)
      const nonCustomSets = asciiCharacterSets.filter(c => c.value !== "custom");
      setAsciiCharacterSet(nonCustomSets[Math.floor(Math.random() * nonCustomSets.length)].value);
      // Cell size and spacing
      setAsciiCellSize(8 + Math.floor(Math.random() * 16));
      setAsciiCharSpacingX(0.4 + Math.random() * 0.5);
      setAsciiCharSpacingY(0.7 + Math.random() * 0.5);
      // Contrast and brightness
      setAsciiContrast(0.7 + Math.random() * 0.8);
      setAsciiBrightness((Math.random() - 0.5) * 0.3);
      setAsciiBgOpacity(0.7 + Math.random() * 0.3);
      // Effects
      setAsciiGlowEffect(Math.random() > 0.6);
      setAsciiGlowIntensity(0.5 + Math.random() * 1.5);
      setAsciiScanlines(Math.random() > 0.7);
      setAsciiChromatic(Math.random() > 0.8);
      // 3D rotation
      setRotationX(Math.random() * 90 - 45);
      setRotationY(Math.random() * 90 - 45);
      setRotationZ(Math.random() * 60 - 30);
      setAutoRotateSpeedX(Math.random() * 1.5);
      setAutoRotateSpeedY(0.5 + Math.random() * 1.5);
      setAutoRotateSpeedZ(Math.random() * 0.5);
    } else if (type === "wavefield") {
      setWavePattern(wavePatterns[Math.floor(Math.random() * wavePatterns.length)].value);
      setLineCount(20 + Math.floor(Math.random() * 40));
      setWaveAmplitude(20 + Math.random() * 80);
      setWaveFrequency(1 + Math.random() * 5);
      setWaveSpeed(0.5 + Math.random() * 2);
    } else if (type === "tunnel") {
      setTunnelShape(tunnelShapes[Math.floor(Math.random() * tunnelShapes.length)].value);
      setTunnelPatternType(tunnelPatternTypes[Math.floor(Math.random() * tunnelPatternTypes.length)].value);
      setZoomSpeed(0.5 + Math.random() * 2);
      setLayerCount(15 + Math.floor(Math.random() * 35));
      setTunnelRotation(Math.random() * 0.5);
    } else if (type === "shader") {
      setShaderPattern(shaderPatterns[Math.floor(Math.random() * shaderPatterns.length)].value);
      setShaderSpeed(0.5 + Math.random() * 2);
      setShaderComplexity(0.5 + Math.random() * 2);
      setShaderSymmetry(2 + Math.floor(Math.random() * 7));
      setShaderZoom(0.5 + Math.random() * 2);
      setShaderRotation(Math.random() * 360);
      // Random colors
      const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      setShaderColorA(randomColor());
      setShaderColorB(randomColor());
      setShaderColorC(randomColor());
    } else if (type === "isometric") {
      // Pleasing randomization for isometric cubes
      setIsometricPattern(isometricPatterns[Math.floor(Math.random() * isometricPatterns.length)].value);

      // Grid size: favor medium grids (10-16) for best visual balance
      setIsometricGridSize(10 + Math.floor(Math.random() * 7));

      // Cube size: favor larger cubes (25-45) for clarity
      setIsometricCubeSize(25 + Math.floor(Math.random() * 20));

      // Height scale: moderate range looks best (1.0-2.0)
      setIsometricHeightScale(1.0 + Math.random() * 1.0);

      // Speed: favor slower, smoother animations (0.5-1.2)
      setIsometricSpeed(0.5 + Math.random() * 0.7);

      // Noise scale: moderate values (1.5-3.0) for pleasing terrain
      setIsometricNoiseScale(1.5 + Math.random() * 1.5);

      // Color mode: weighted toward single and height for cleaner look
      const colorModeRoll = Math.random();
      if (colorModeRoll < 0.4) {
        setIsometricColorMode("single");
      } else if (colorModeRoll < 0.7) {
        setIsometricColorMode("height");
      } else if (colorModeRoll < 0.9) {
        setIsometricColorMode("gradient");
      } else {
        setIsometricColorMode("rainbow");
      }

      // Pleasing color palettes for isometric
      const palettes = [
        { base: "#3366ff", stroke: "#6699ff" }, // Classic blue
        { base: "#8b5cf6", stroke: "#a78bfa" }, // Purple
        { base: "#06b6d4", stroke: "#22d3ee" }, // Cyan
        { base: "#10b981", stroke: "#34d399" }, // Emerald
        { base: "#f59e0b", stroke: "#fbbf24" }, // Amber
        { base: "#ef4444", stroke: "#f87171" }, // Red
        { base: "#ec4899", stroke: "#f472b6" }, // Pink
        { base: "#6366f1", stroke: "#818cf8" }, // Indigo
      ];
      const palette = palettes[Math.floor(Math.random() * palettes.length)];
      setIsometricBaseColor(palette.base);
      setIsometricStrokeColor(palette.stroke);

      // Stroke width: favor thin strokes (0.5-1.5)
      setIsometricStrokeWidth(0.5 + Math.random() * 1);

      // Shading: keep realistic lighting ratios
      setIsometricTopShade(1.1 + Math.random() * 0.2);    // 1.1-1.3 (brightest)
      setIsometricLeftShade(0.7 + Math.random() * 0.2);   // 0.7-0.9 (medium)
      setIsometricRightShade(0.4 + Math.random() * 0.2);  // 0.4-0.6 (darkest)

      // Glow: occasional, subtle
      setIsometricEnableGlow(Math.random() > 0.7);
      setIsometricGlowIntensity(0.5 + Math.random() * 0.8);

      // Rotation: random starting angle, occasional auto-rotate
      setIsometricRotation(Math.floor(Math.random() * 360));
      setIsometricAutoRotate(Math.random() > 0.6);
      setIsometricAutoRotateSpeed(0.1 + Math.random() * 0.4);
    }

    // Randomize rainbow
    setHueStart(Math.floor(Math.random() * 360));
    setHueEnd(Math.floor(Math.random() * 360));
  };

  return (
    <div className="h-screen w-screen bg-neutral-950 flex flex-col overflow-hidden">
      {/* Video Player */}
      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0">
          {type === "ascii" && (
            <AsciiCanvas
              ref={asciiCanvasRef}
              pattern={asciiPattern as any}
              speed={asciiSpeed}
              density={asciiDensity}
              colorMode={asciiColorMode as any}
              textColor={asciiColor}
              hueStart={hueStart}
              hueEnd={hueEnd}
              saturation={saturation}
              lightness={lightness}
              rotationX={rotationX}
              rotationY={rotationY}
              rotationZ={rotationZ}
              autoRotate={autoRotate}
              autoRotateSpeedX={autoRotateSpeedX}
              autoRotateSpeedY={autoRotateSpeedY}
              autoRotateSpeedZ={autoRotateSpeedZ}
              imageData={asciiImageData}
              imageInvert={asciiImageInvert}
              imageAnimate={asciiImageAnimate}
              cellSize={asciiCellSize}
              characterSet={asciiCharacterSet as any}
              customChars={asciiCustomChars}
              fontFamily={asciiFontFamily as any}
              charSpacingX={asciiCharSpacingX}
              charSpacingY={asciiCharSpacingY}
              contrast={asciiContrast}
              brightness={asciiBrightness}
              bgOpacity={asciiBgOpacity}
              renderMode={asciiRenderMode as any}
              glowEffect={asciiGlowEffect}
              glowIntensity={asciiGlowIntensity}
              scanlines={asciiScanlines}
              chromatic={asciiChromatic}
            />
          )}
          {type === "wavefield" && (
            <WaveCanvas
              ref={waveCanvasRef}
              pattern={wavePattern as any}
              lineCount={lineCount}
              amplitude={waveAmplitude}
              frequency={waveFrequency}
              speed={waveSpeed}
              perspective={wavePerspective}
              colorMode={waveColorMode as any}
              lineColor={waveColor}
              hueStart={hueStart}
              hueEnd={hueEnd}
              saturation={saturation}
              lightness={lightness}
            />
          )}
          {type === "tunnel" && (
            <TunnelCanvas
              ref={tunnelCanvasRef}
              shape={tunnelShape as any}
              pattern={tunnelPatternType as any}
              layerCount={layerCount}
              zoomSpeed={zoomSpeed}
              zoomDirection={zoomDirection as any}
              rotationSpeed={tunnelRotation}
              enableGlow={enableGlow}
              glowIntensity={glowIntensity}
              hueStart={hueStart}
              hueEnd={hueEnd}
              saturation={saturation}
              lightness={lightness}
            />
          )}
          {type === "shader" && (
            <ShaderCanvas
              ref={shaderCanvasRef}
              pattern={shaderPattern as any}
              speed={shaderSpeed}
              complexity={shaderComplexity}
              colorA={shaderColorA}
              colorB={shaderColorB}
              colorC={shaderColorC}
              symmetry={shaderSymmetry}
              zoom={shaderZoom}
              rotation={shaderRotation}
              enableNoise={enableNoise}
              seed={seed}
            />
          )}
          {type === "isometric" && (
            <IsometricCanvas
              ref={isometricCanvasRef}
              heightPattern={isometricPattern as any}
              gridSize={isometricGridSize}
              cubeSize={isometricCubeSize}
              heightScale={isometricHeightScale}
              speed={isometricSpeed}
              noiseScale={isometricNoiseScale}
              baseColor={isometricBaseColor}
              strokeColor={isometricStrokeColor}
              strokeWidth={isometricStrokeWidth}
              colorMode={isometricColorMode as any}
              topShade={isometricTopShade}
              leftShade={isometricLeftShade}
              rightShade={isometricRightShade}
              enableGlow={isometricEnableGlow}
              glowIntensity={isometricGlowIntensity}
              rotation={isometricRotation}
              autoRotate={isometricAutoRotate}
              autoRotateSpeed={isometricAutoRotateSpeed}
              hueStart={hueStart}
              hueEnd={hueEnd}
              saturation={saturation}
              lightness={lightness}
              seed={seed}
            />
          )}
        </div>
      </div>

      {/* Controls Panel */}
      <div className="bg-neutral-900 border-t border-neutral-800">
        {/* Main Controls */}
        <div className="px-4 py-3 border-b border-neutral-800">
          <div className="max-w-5xl mx-auto flex items-center gap-4 flex-wrap">
            {/* Type Selector */}
            <Tabs value={type} onValueChange={(v) => setType(v as AnimationType)}>
              <TabsList className="bg-neutral-800 border border-neutral-700">
                <TabsTrigger
                  value="ascii"
                  className="text-sm text-neutral-300 data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
                >
                  ASCII
                </TabsTrigger>
                <TabsTrigger
                  value="wavefield"
                  className="text-sm text-neutral-300 data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
                >
                  Wave
                </TabsTrigger>
                <TabsTrigger
                  value="tunnel"
                  className="text-sm text-neutral-300 data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
                >
                  Tunnel
                </TabsTrigger>
                <TabsTrigger
                  value="shader"
                  className="text-sm text-neutral-300 data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
                >
                  Shader
                </TabsTrigger>
                <TabsTrigger
                  value="isometric"
                  className="text-sm text-neutral-300 data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
                >
                  Isometric
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="h-6 w-px bg-neutral-700" />

            {/* Pattern Select */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-neutral-400">Pattern</Label>
              {type === "ascii" && (
                <Select value={asciiPattern} onValueChange={setAsciiPattern}>
                  <SelectTrigger className="w-32 h-9 text-sm bg-neutral-800 border-neutral-700 text-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {asciiPatterns.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-sm text-neutral-200">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {type === "wavefield" && (
                <Select value={wavePattern} onValueChange={setWavePattern}>
                  <SelectTrigger className="w-32 h-9 text-sm bg-neutral-800 border-neutral-700 text-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {wavePatterns.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-sm text-neutral-200">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {type === "tunnel" && (
                <Select value={tunnelShape} onValueChange={setTunnelShape}>
                  <SelectTrigger className="w-32 h-9 text-sm bg-neutral-800 border-neutral-700 text-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {tunnelShapes.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-sm text-neutral-200">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {type === "shader" && (
                <Select value={shaderPattern} onValueChange={setShaderPattern}>
                  <SelectTrigger className="w-32 h-9 text-sm bg-neutral-800 border-neutral-700 text-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {shaderPatterns.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-sm text-neutral-200">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {type === "isometric" && (
                <Select value={isometricPattern} onValueChange={setIsometricPattern}>
                  <SelectTrigger className="w-32 h-9 text-sm bg-neutral-800 border-neutral-700 text-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {isometricPatterns.map((p) => (
                      <SelectItem key={p.value} value={p.value} className="text-sm text-neutral-200">
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="h-6 w-px bg-neutral-700" />

            {/* Primary Slider with Input */}
            <div className="flex items-center gap-3 min-w-[220px]">
              <Label className="text-sm text-neutral-400 w-12">
                {type === "ascii" ? "Speed" : type === "wavefield" ? "Lines" : type === "tunnel" ? "Speed" : type === "isometric" ? "Grid" : "Speed"}
              </Label>
              {type === "ascii" && (
                <>
                  <Slider
                    value={[asciiSpeed]}
                    onValueChange={([v]) => setAsciiSpeed(v)}
                    min={0.3}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={asciiSpeed.toFixed(1)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) setAsciiSpeed(Math.min(3, Math.max(0.3, v)));
                    }}
                    min={0.3}
                    max={3}
                    step={0.1}
                    className="h-7 w-16 text-xs text-right bg-neutral-800 border-neutral-700 text-neutral-200 px-2"
                  />
                </>
              )}
              {type === "wavefield" && (
                <>
                  <Slider
                    value={[lineCount]}
                    onValueChange={([v]) => setLineCount(v)}
                    min={10}
                    max={80}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={lineCount}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v)) setLineCount(Math.min(80, Math.max(10, v)));
                    }}
                    min={10}
                    max={80}
                    step={1}
                    className="h-7 w-16 text-xs text-right bg-neutral-800 border-neutral-700 text-neutral-200 px-2"
                  />
                </>
              )}
              {type === "tunnel" && (
                <>
                  <Slider
                    value={[zoomSpeed]}
                    onValueChange={([v]) => setZoomSpeed(v)}
                    min={0.3}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={zoomSpeed.toFixed(1)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) setZoomSpeed(Math.min(3, Math.max(0.3, v)));
                    }}
                    min={0.3}
                    max={3}
                    step={0.1}
                    className="h-7 w-16 text-xs text-right bg-neutral-800 border-neutral-700 text-neutral-200 px-2"
                  />
                </>
              )}
              {type === "shader" && (
                <>
                  <Slider
                    value={[shaderSpeed]}
                    onValueChange={([v]) => setShaderSpeed(v)}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={shaderSpeed.toFixed(1)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) setShaderSpeed(Math.min(3, Math.max(0.1, v)));
                    }}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="h-7 w-16 text-xs text-right bg-neutral-800 border-neutral-700 text-neutral-200 px-2"
                  />
                </>
              )}
              {type === "isometric" && (
                <>
                  <Slider
                    value={[isometricGridSize]}
                    onValueChange={([v]) => setIsometricGridSize(v)}
                    min={5}
                    max={20}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={isometricGridSize}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v)) setIsometricGridSize(Math.min(20, Math.max(5, v)));
                    }}
                    min={5}
                    max={20}
                    step={1}
                    className="h-7 w-16 text-xs text-right bg-neutral-800 border-neutral-700 text-neutral-200 px-2"
                  />
                </>
              )}
            </div>

            <div className="flex-1" />

            {/* Action Buttons */}
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outline"
              size="sm"
              className="text-sm bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            >
              {showAdvanced ? "Hide" : "Advanced"}
            </Button>
            <Button
              onClick={randomize}
              size="sm"
              className="text-sm bg-neutral-200 text-neutral-900 hover:bg-white"
            >
              Randomize
            </Button>
            <Button
              onClick={copyShareLink}
              size="sm"
              variant="outline"
              className="text-sm bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            >
              {linkCopied ? "Copied!" : "Share"}
            </Button>
            <DownloadButton canvasRef={activeCanvasRef} />
          </div>
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="px-4 py-4 max-h-64 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {/* Type-specific controls */}
                {type === "ascii" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Characters</Label>
                      <Select value={asciiCharacterSet} onValueChange={setAsciiCharacterSet}>
                        <SelectTrigger className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          {asciiCharacterSets.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="text-xs text-neutral-200">
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Color Mode</Label>
                      <Select value={asciiColorMode} onValueChange={setAsciiColorMode}>
                        <SelectTrigger className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          {asciiColorModes.map((m) => (
                            <SelectItem key={m.value} value={m.value} className="text-xs text-neutral-200">
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <SliderWithInput
                      label="Cell Size"
                      value={asciiCellSize}
                      onChange={setAsciiCellSize}
                      min={4}
                      max={32}
                      step={1}
                      decimals={0}
                    />
                    <SliderWithInput
                      label="Density"
                      value={asciiDensity}
                      onChange={setAsciiDensity}
                      min={0.5}
                      max={2}
                      step={0.1}
                    />
                    <SliderWithInput
                      label="Contrast"
                      value={asciiContrast}
                      onChange={setAsciiContrast}
                      min={0.5}
                      max={2}
                      step={0.1}
                    />
                    <SliderWithInput
                      label="Brightness"
                      value={asciiBrightness}
                      onChange={setAsciiBrightness}
                      min={-0.5}
                      max={0.5}
                      step={0.05}
                      decimals={2}
                    />
                    {asciiColorMode === "single" && (
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-400">Color</Label>
                        <Input
                          type="color"
                          value={asciiColor}
                          onChange={(e) => setAsciiColor(e.target.value)}
                          className="h-8 w-full p-1 bg-neutral-800 border-neutral-700"
                        />
                      </div>
                    )}
                    {/* Character & Font Settings */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-6 border-t border-neutral-700 pt-3 mt-2">
                      <Label className="text-xs text-neutral-300 font-medium">Character Settings</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Font</Label>
                      <Select value={asciiFontFamily} onValueChange={setAsciiFontFamily}>
                        <SelectTrigger className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          {asciiFontFamilies.map((f) => (
                            <SelectItem key={f.value} value={f.value} className="text-xs text-neutral-200">
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <SliderWithInput
                      label="Spacing X"
                      value={asciiCharSpacingX}
                      onChange={setAsciiCharSpacingX}
                      min={0.3}
                      max={1.2}
                      step={0.05}
                      decimals={2}
                    />
                    <SliderWithInput
                      label="Spacing Y"
                      value={asciiCharSpacingY}
                      onChange={setAsciiCharSpacingY}
                      min={0.5}
                      max={1.5}
                      step={0.05}
                      decimals={2}
                    />
                    <SliderWithInput
                      label="BG Opacity"
                      value={asciiBgOpacity}
                      onChange={setAsciiBgOpacity}
                      min={0}
                      max={1}
                      step={0.05}
                      decimals={2}
                    />
                    {asciiCharacterSet === "custom" && (
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs text-neutral-400">Custom Characters</Label>
                        <Input
                          type="text"
                          value={asciiCustomChars}
                          onChange={(e) => setAsciiCustomChars(e.target.value)}
                          placeholder="Enter characters..."
                          className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200"
                        />
                      </div>
                    )}
                    {/* Effects */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-6 border-t border-neutral-700 pt-3 mt-2">
                      <Label className="text-xs text-neutral-300 font-medium">Effects</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Glow</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={asciiGlowEffect}
                          onChange={(e) => setAsciiGlowEffect(e.target.checked)}
                          className="rounded border-neutral-700 h-4 w-4"
                        />
                      </div>
                    </div>
                    {asciiGlowEffect && (
                      <SliderWithInput
                        label="Glow Int."
                        value={asciiGlowIntensity}
                        onChange={setAsciiGlowIntensity}
                        min={0.5}
                        max={3}
                        step={0.1}
                      />
                    )}
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Scanlines</Label>
                      <div className="flex items-center h-8">
                        <input
                          type="checkbox"
                          checked={asciiScanlines}
                          onChange={(e) => setAsciiScanlines(e.target.checked)}
                          className="rounded border-neutral-700 h-4 w-4"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Chromatic</Label>
                      <div className="flex items-center h-8">
                        <input
                          type="checkbox"
                          checked={asciiChromatic}
                          onChange={(e) => setAsciiChromatic(e.target.checked)}
                          className="rounded border-neutral-700 h-4 w-4"
                        />
                      </div>
                    </div>
                    {/* 3D Rotation Controls - only for 3D patterns */}
                    {(asciiPattern === "donut" || asciiPattern === "cube" || asciiPattern === "sphere") && (
                      <>
                        <div className="col-span-2 md:col-span-4 lg:col-span-6 border-t border-neutral-700 pt-3 mt-2">
                          <div className="flex items-center gap-3 mb-3">
                            <Label className="text-xs text-neutral-300 font-medium">3D Rotation</Label>
                            <label className="flex items-center gap-1.5 text-xs text-neutral-400">
                              <input
                                type="checkbox"
                                checked={autoRotate}
                                onChange={(e) => setAutoRotate(e.target.checked)}
                                className="rounded border-neutral-600"
                              />
                              Auto-rotate
                            </label>
                          </div>
                        </div>
                        <SliderWithInput
                          label="Rotation X"
                          value={rotationX}
                          onChange={setRotationX}
                          min={-180}
                          max={180}
                          step={1}
                          decimals={0}
                        />
                        <SliderWithInput
                          label="Rotation Y"
                          value={rotationY}
                          onChange={setRotationY}
                          min={-180}
                          max={180}
                          step={1}
                          decimals={0}
                        />
                        <SliderWithInput
                          label="Rotation Z"
                          value={rotationZ}
                          onChange={setRotationZ}
                          min={-180}
                          max={180}
                          step={1}
                          decimals={0}
                        />
                        {autoRotate && (
                          <>
                            <SliderWithInput
                              label="Speed X"
                              value={autoRotateSpeedX}
                              onChange={setAutoRotateSpeedX}
                              min={0}
                              max={3}
                              step={0.1}
                            />
                            <SliderWithInput
                              label="Speed Y"
                              value={autoRotateSpeedY}
                              onChange={setAutoRotateSpeedY}
                              min={0}
                              max={3}
                              step={0.1}
                            />
                            <SliderWithInput
                              label="Speed Z"
                              value={autoRotateSpeedZ}
                              onChange={setAutoRotateSpeedZ}
                              min={0}
                              max={3}
                              step={0.1}
                            />
                          </>
                        )}
                      </>
                    )}
                    {/* Image-to-ASCII Controls */}
                    {asciiPattern === "image" && (
                      <>
                        <div className="col-span-2 md:col-span-4 lg:col-span-6 border-t border-neutral-700 pt-3 mt-2">
                          <Label className="text-xs text-neutral-300 font-medium">Image to ASCII</Label>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label className="text-xs text-neutral-400">Upload Image</Label>
                          <div className="flex gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                            >
                              {asciiImageData ? "Change Image" : "Choose Image"}
                            </Button>
                            {asciiImageData && (
                              <Button
                                onClick={() => setAsciiImageData(undefined)}
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs bg-red-900/50 border-red-700 text-red-300 hover:bg-red-900"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-400">Render Mode</Label>
                          <Select value={asciiRenderMode} onValueChange={setAsciiRenderMode}>
                            <SelectTrigger className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700">
                              {asciiRenderModes.map((r) => (
                                <SelectItem key={r.value} value={r.value} className="text-xs text-neutral-200">
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-400">Invert</Label>
                          <div className="flex items-center h-8">
                            <input
                              type="checkbox"
                              checked={asciiImageInvert}
                              onChange={(e) => setAsciiImageInvert(e.target.checked)}
                              className="rounded border-neutral-700 h-4 w-4"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-400">Animate</Label>
                          <div className="flex items-center h-8">
                            <input
                              type="checkbox"
                              checked={asciiImageAnimate}
                              onChange={(e) => setAsciiImageAnimate(e.target.checked)}
                              className="rounded border-neutral-700 h-4 w-4"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {type === "wavefield" && (
                  <>
                    <SliderWithInput
                      label="Amplitude"
                      value={waveAmplitude}
                      onChange={setWaveAmplitude}
                      min={10}
                      max={150}
                      step={5}
                      decimals={0}
                    />
                    <SliderWithInput
                      label="Frequency"
                      value={waveFrequency}
                      onChange={setWaveFrequency}
                      min={0.5}
                      max={8}
                      step={0.5}
                    />
                    <SliderWithInput
                      label="Speed"
                      value={waveSpeed}
                      onChange={setWaveSpeed}
                      min={0.1}
                      max={3}
                      step={0.1}
                    />
                    <SliderWithInput
                      label="Perspective"
                      value={wavePerspective}
                      onChange={setWavePerspective}
                      min={0}
                      max={1}
                      step={0.05}
                      decimals={2}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Color Mode</Label>
                      <Select value={waveColorMode} onValueChange={setWaveColorMode}>
                        <SelectTrigger className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          <SelectItem value="rainbow" className="text-xs text-neutral-200">Rainbow</SelectItem>
                          <SelectItem value="single" className="text-xs text-neutral-200">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {waveColorMode === "single" && (
                      <div className="space-y-2">
                        <Label className="text-xs text-neutral-400">Color</Label>
                        <Input
                          type="color"
                          value={waveColor}
                          onChange={(e) => setWaveColor(e.target.value)}
                          className="h-8 w-full p-1 bg-neutral-800 border-neutral-700"
                        />
                      </div>
                    )}
                  </>
                )}

                {type === "tunnel" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Type</Label>
                      <Select value={tunnelPatternType} onValueChange={setTunnelPatternType}>
                        <SelectTrigger className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          {tunnelPatternTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-xs text-neutral-200">
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Direction</Label>
                      <Select value={zoomDirection} onValueChange={setZoomDirection}>
                        <SelectTrigger className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          <SelectItem value="in" className="text-xs text-neutral-200">Zoom In</SelectItem>
                          <SelectItem value="out" className="text-xs text-neutral-200">Zoom Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <SliderWithInput
                      label="Layers"
                      value={layerCount}
                      onChange={setLayerCount}
                      min={10}
                      max={60}
                      step={1}
                      decimals={0}
                    />
                    <SliderWithInput
                      label="Rotation"
                      value={tunnelRotation}
                      onChange={setTunnelRotation}
                      min={0}
                      max={1}
                      step={0.05}
                      decimals={2}
                    />
                    <SliderWithInput
                      label="Glow"
                      value={glowIntensity}
                      onChange={setGlowIntensity}
                      min={0.3}
                      max={2}
                      step={0.1}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Enable Glow</Label>
                      <div className="flex items-center h-8">
                        <input
                          type="checkbox"
                          checked={enableGlow}
                          onChange={(e) => setEnableGlow(e.target.checked)}
                          className="rounded border-neutral-700 h-4 w-4"
                        />
                      </div>
                    </div>
                  </>
                )}

                {type === "shader" && (
                  <>
                    <SliderWithInput
                      label="Complexity"
                      value={shaderComplexity}
                      onChange={setShaderComplexity}
                      min={0.2}
                      max={3}
                      step={0.1}
                    />
                    <SliderWithInput
                      label="Symmetry"
                      value={shaderSymmetry}
                      onChange={setShaderSymmetry}
                      min={1}
                      max={12}
                      step={1}
                      decimals={0}
                    />
                    <SliderWithInput
                      label="Zoom"
                      value={shaderZoom}
                      onChange={setShaderZoom}
                      min={0.2}
                      max={4}
                      step={0.1}
                    />
                    <SliderWithInput
                      label="Rotation"
                      value={shaderRotation}
                      onChange={setShaderRotation}
                      min={0}
                      max={360}
                      step={5}
                      decimals={0}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Color A</Label>
                      <Input
                        type="color"
                        value={shaderColorA}
                        onChange={(e) => setShaderColorA(e.target.value)}
                        className="h-8 w-full p-1 bg-neutral-800 border-neutral-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Color B</Label>
                      <Input
                        type="color"
                        value={shaderColorB}
                        onChange={(e) => setShaderColorB(e.target.value)}
                        className="h-8 w-full p-1 bg-neutral-800 border-neutral-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Color C</Label>
                      <Input
                        type="color"
                        value={shaderColorC}
                        onChange={(e) => setShaderColorC(e.target.value)}
                        className="h-8 w-full p-1 bg-neutral-800 border-neutral-700"
                      />
                    </div>
                  </>
                )}

                {type === "isometric" && (
                  <>
                    <SliderWithInput
                      label="Cube Size"
                      value={isometricCubeSize}
                      onChange={setIsometricCubeSize}
                      min={15}
                      max={50}
                      step={1}
                      decimals={0}
                    />
                    <SliderWithInput
                      label="Height"
                      value={isometricHeightScale}
                      onChange={setIsometricHeightScale}
                      min={0.3}
                      max={6}
                      step={0.1}
                    />
                    <SliderWithInput
                      label="Speed"
                      value={isometricSpeed}
                      onChange={setIsometricSpeed}
                      min={0.1}
                      max={5}
                      step={0.1}
                    />
                    <SliderWithInput
                      label="Noise Scale"
                      value={isometricNoiseScale}
                      onChange={setIsometricNoiseScale}
                      min={0.5}
                      max={5}
                      step={0.1}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Color Mode</Label>
                      <Select value={isometricColorMode} onValueChange={setIsometricColorMode}>
                        <SelectTrigger className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          {isometricColorModes.map((m) => (
                            <SelectItem key={m.value} value={m.value} className="text-xs text-neutral-200">
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Base Color</Label>
                      <Input
                        type="color"
                        value={isometricBaseColor}
                        onChange={(e) => setIsometricBaseColor(e.target.value)}
                        className="h-8 w-full p-1 bg-neutral-800 border-neutral-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Stroke Color</Label>
                      <Input
                        type="color"
                        value={isometricStrokeColor}
                        onChange={(e) => setIsometricStrokeColor(e.target.value)}
                        className="h-8 w-full p-1 bg-neutral-800 border-neutral-700"
                      />
                    </div>
                    <SliderWithInput
                      label="Stroke"
                      value={isometricStrokeWidth}
                      onChange={setIsometricStrokeWidth}
                      min={0}
                      max={3}
                      step={0.5}
                    />
                    <SliderWithInput
                      label="Top Shade"
                      value={isometricTopShade}
                      onChange={setIsometricTopShade}
                      min={0.5}
                      max={1.5}
                      step={0.05}
                      decimals={2}
                    />
                    <SliderWithInput
                      label="Left Shade"
                      value={isometricLeftShade}
                      onChange={setIsometricLeftShade}
                      min={0.3}
                      max={1.2}
                      step={0.05}
                      decimals={2}
                    />
                    <SliderWithInput
                      label="Right Shade"
                      value={isometricRightShade}
                      onChange={setIsometricRightShade}
                      min={0.2}
                      max={1}
                      step={0.05}
                      decimals={2}
                    />
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Glow</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isometricEnableGlow}
                          onChange={(e) => setIsometricEnableGlow(e.target.checked)}
                          className="rounded border-neutral-700 h-4 w-4"
                        />
                      </div>
                    </div>
                    {isometricEnableGlow && (
                      <SliderWithInput
                        label="Glow Int."
                        value={isometricGlowIntensity}
                        onChange={setIsometricGlowIntensity}
                        min={0.3}
                        max={2}
                        step={0.1}
                      />
                    )}
                    <div className="col-span-2 md:col-span-4 lg:col-span-6 border-t border-neutral-700 pt-3 mt-2">
                      <div className="flex items-center gap-3 mb-3">
                        <Label className="text-xs text-neutral-300 font-medium">Rotation</Label>
                        <label className="flex items-center gap-1.5 text-xs text-neutral-400">
                          <input
                            type="checkbox"
                            checked={isometricAutoRotate}
                            onChange={(e) => setIsometricAutoRotate(e.target.checked)}
                            className="rounded border-neutral-600"
                          />
                          Auto-rotate
                        </label>
                      </div>
                    </div>
                    <SliderWithInput
                      label="Rotation"
                      value={isometricRotation}
                      onChange={setIsometricRotation}
                      min={0}
                      max={360}
                      step={5}
                      decimals={0}
                    />
                    {isometricAutoRotate && (
                      <SliderWithInput
                        label="Rotate Speed"
                        value={isometricAutoRotateSpeed}
                        onChange={setIsometricAutoRotateSpeed}
                        min={0.05}
                        max={1}
                        step={0.05}
                        decimals={2}
                      />
                    )}
                  </>
                )}

                {/* Shared controls */}
                <SliderWithInput
                  label="Hue Start"
                  value={hueStart}
                  onChange={setHueStart}
                  min={0}
                  max={360}
                  step={5}
                  decimals={0}
                />
                <SliderWithInput
                  label="Hue End"
                  value={hueEnd}
                  onChange={setHueEnd}
                  min={0}
                  max={360}
                  step={5}
                  decimals={0}
                />

                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400">Effects</Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-neutral-300">
                      <input
                        type="checkbox"
                        checked={enableNoise}
                        onChange={(e) => setEnableNoise(e.target.checked)}
                        className="rounded border-neutral-700"
                      />
                      Noise
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-neutral-300">
                      <input
                        type="checkbox"
                        checked={enableVignette}
                        onChange={(e) => setEnableVignette(e.target.checked)}
                        className="rounded border-neutral-700"
                      />
                      Vignette
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-neutral-400">Seed</Label>
                    <Input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                      className="h-6 w-20 text-xs text-right bg-neutral-800 border-neutral-700 text-neutral-200 px-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
