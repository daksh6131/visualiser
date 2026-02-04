"use client";

import { useState, useMemo } from "react";
import { Player } from "@remotion/player";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { EnhancedGeometric } from "@/remotion/compositions/EnhancedGeometric";
import { AsciiAnimation } from "@/remotion/compositions/AsciiAnimation";
import { WaveField } from "@/remotion/compositions/WaveField";
import { TunnelZoom } from "@/remotion/compositions/TunnelZoom";
import { defaultRainbowConfig } from "@/remotion/utils/colors";

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

const geometricShapes = [
  { value: "hexagon", label: "Hexagon" },
  { value: "triangle", label: "Triangle" },
  { value: "square", label: "Square" },
  { value: "circle", label: "Circle" },
  { value: "star", label: "Star" },
];

type AnimationType = "geometric" | "wavefield" | "ascii" | "tunnel";

export default function Home() {
  const [type, setType] = useState<AnimationType>("ascii");

  // Shared
  const [seed, setSeed] = useState(42);
  const [duration] = useState(10);

  // ASCII
  const [asciiPattern, setAsciiPattern] = useState("donut");
  const [asciiSpeed, setAsciiSpeed] = useState(1);

  // Wave
  const [wavePattern, setWavePattern] = useState("vortex");
  const [lineCount, setLineCount] = useState(40);

  // Tunnel
  const [tunnelShape, setTunnelShape] = useState("circle");
  const [zoomSpeed, setZoomSpeed] = useState(1);

  // Geometric
  const [geoShape, setGeoShape] = useState("hexagon");
  const [shapeCount, setShapeCount] = useState(3);

  const rainbowConfig = useMemo(() => ({
    ...defaultRainbowConfig,
    animate: true,
    speed: 1,
  }), []);

  const randomize = () => {
    setSeed(Math.floor(Math.random() * 10000));

    if (type === "ascii") {
      setAsciiPattern(asciiPatterns[Math.floor(Math.random() * asciiPatterns.length)].value);
      setAsciiSpeed(0.5 + Math.random() * 2);
    } else if (type === "wavefield") {
      setWavePattern(wavePatterns[Math.floor(Math.random() * wavePatterns.length)].value);
      setLineCount(20 + Math.floor(Math.random() * 40));
    } else if (type === "tunnel") {
      setTunnelShape(tunnelShapes[Math.floor(Math.random() * tunnelShapes.length)].value);
      setZoomSpeed(0.5 + Math.random() * 2);
    } else if (type === "geometric") {
      setGeoShape(geometricShapes[Math.floor(Math.random() * geometricShapes.length)].value);
      setShapeCount(1 + Math.floor(Math.random() * 5));
    }
  };

  const asciiProps = useMemo(() => ({
    pattern: asciiPattern as any,
    backgroundColor: "#000000",
    textColor: "#00ff00",
    colorMode: "green" as const,
    rainbowConfig,
    speed: asciiSpeed,
    density: 1,
    enableNoise: true,
    enableVignette: true,
    seed,
  }), [asciiPattern, asciiSpeed, rainbowConfig, seed]);

  const waveProps = useMemo(() => ({
    backgroundColor: "#000000",
    lineColor: "#ffffff",
    pattern: wavePattern as any,
    lineCount,
    segmentsPerLine: 100,
    amplitude: 50,
    frequency: 3,
    speed: 1,
    perspective: 0.6,
    rotationSpeed: 0.5,
    enableNoise: true,
    enableVignette: true,
    seed,
    colorMode: "rainbow" as const,
    rainbowConfig,
  }), [wavePattern, lineCount, rainbowConfig, seed]);

  const tunnelProps = useMemo(() => ({
    backgroundColor: "#000000",
    primaryColor: "#ffffff",
    pattern: "concentric" as const,
    shapeType: tunnelShape as any,
    layerCount: 30,
    colorMode: "rainbow" as const,
    rainbowConfig,
    gradientColors: ["#ff0066", "#6600ff", "#00ff66"],
    zoomSpeed,
    zoomDirection: "in" as const,
    enableMeshGradient: false,
    meshColors: ["#ff0066", "#6600ff", "#00ff66"],
    enableGlow: true,
    glowIntensity: 1,
    strokeWidth: 3,
    enableNoise: true,
    enableVignette: true,
    rotationSpeed: 0.2,
    seed,
  }), [tunnelShape, zoomSpeed, rainbowConfig, seed]);

  const geometricProps = useMemo(() => ({
    backgroundColor: "#0a1628",
    primaryColor: "#fbbf24",
    accentColor: "#ec4899",
    shape: geoShape as any,
    shapeCount,
    mixShapes: false,
    enableNoise: true,
    enableScanlines: true,
    enableParticles: true,
    enableVignette: true,
    enableGlitch: false,
    enableDither: true,
    ditherPattern: "bayer" as const,
    enableBloom: true,
    enableChromaticAberration: false,
    enableMirror: false,
    enableTrails: false,
    motionPattern: "float" as const,
    motionSpeed: 1,
    motionIntensity: 1,
    seed,
  }), [geoShape, shapeCount, seed]);

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Video Player - Full width */}
      <div className="flex-1 relative">
        <div className="absolute inset-0">
          {type === "ascii" && (
            <Player
              component={AsciiAnimation}
              inputProps={asciiProps}
              durationInFrames={duration * 30}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              loop
              autoPlay
            />
          )}
          {type === "wavefield" && (
            <Player
              component={WaveField}
              inputProps={waveProps}
              durationInFrames={duration * 30}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              loop
              autoPlay
            />
          )}
          {type === "tunnel" && (
            <Player
              component={TunnelZoom}
              inputProps={tunnelProps}
              durationInFrames={duration * 30}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              loop
              autoPlay
            />
          )}
          {type === "geometric" && (
            <Player
              component={EnhancedGeometric}
              inputProps={geometricProps}
              durationInFrames={duration * 30}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              loop
              autoPlay
            />
          )}
        </div>
      </div>

      {/* Controls Bar - Bottom */}
      <div className="bg-black/80 backdrop-blur border-t border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          {/* Type Selector */}
          <Tabs value={type} onValueChange={(v) => setType(v as AnimationType)}>
            <TabsList className="bg-white/5">
              <TabsTrigger value="ascii" className="text-xs data-[state=active]:bg-white/10">ASCII</TabsTrigger>
              <TabsTrigger value="wavefield" className="text-xs data-[state=active]:bg-white/10">Wave</TabsTrigger>
              <TabsTrigger value="tunnel" className="text-xs data-[state=active]:bg-white/10">Tunnel</TabsTrigger>
              <TabsTrigger value="geometric" className="text-xs data-[state=active]:bg-white/10">Geo</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Pattern/Shape Select */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-white/50">Pattern</Label>
            {type === "ascii" && (
              <Select value={asciiPattern} onValueChange={setAsciiPattern}>
                <SelectTrigger className="w-28 h-8 text-xs bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {asciiPatterns.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {type === "wavefield" && (
              <Select value={wavePattern} onValueChange={setWavePattern}>
                <SelectTrigger className="w-28 h-8 text-xs bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {wavePatterns.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {type === "tunnel" && (
              <Select value={tunnelShape} onValueChange={setTunnelShape}>
                <SelectTrigger className="w-28 h-8 text-xs bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tunnelShapes.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {type === "geometric" && (
              <Select value={geoShape} onValueChange={setGeoShape}>
                <SelectTrigger className="w-28 h-8 text-xs bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {geometricShapes.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Speed/Count Slider */}
          <div className="flex items-center gap-2 flex-1 max-w-48">
            <Label className="text-xs text-white/50 whitespace-nowrap">
              {type === "ascii" ? "Speed" : type === "wavefield" ? "Lines" : type === "tunnel" ? "Speed" : "Count"}
            </Label>
            {type === "ascii" && (
              <Slider
                value={[asciiSpeed]}
                onValueChange={([v]) => setAsciiSpeed(v)}
                min={0.3}
                max={3}
                step={0.1}
                className="flex-1"
              />
            )}
            {type === "wavefield" && (
              <Slider
                value={[lineCount]}
                onValueChange={([v]) => setLineCount(v)}
                min={10}
                max={80}
                step={1}
                className="flex-1"
              />
            )}
            {type === "tunnel" && (
              <Slider
                value={[zoomSpeed]}
                onValueChange={([v]) => setZoomSpeed(v)}
                min={0.3}
                max={3}
                step={0.1}
                className="flex-1"
              />
            )}
            {type === "geometric" && (
              <Slider
                value={[shapeCount]}
                onValueChange={([v]) => setShapeCount(v)}
                min={1}
                max={8}
                step={1}
                className="flex-1"
              />
            )}
          </div>

          {/* Randomize Button */}
          <Button
            onClick={randomize}
            variant="outline"
            size="sm"
            className="text-xs bg-white/5 border-white/10 hover:bg-white/10"
          >
            Randomize
          </Button>
        </div>
      </div>
    </div>
  );
}
