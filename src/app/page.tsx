"use client";

import { useState, useMemo } from "react";
import { Player } from "@remotion/player";
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

const asciiColorModes = [
  { value: "green", label: "Matrix Green" },
  { value: "single", label: "Custom" },
  { value: "rainbow", label: "Rainbow" },
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

const geometricShapes = [
  { value: "hexagon", label: "Hexagon" },
  { value: "triangle", label: "Triangle" },
  { value: "square", label: "Square" },
  { value: "circle", label: "Circle" },
  { value: "star", label: "Star" },
  { value: "pentagon", label: "Pentagon" },
  { value: "octagon", label: "Octagon" },
];

const motionPatterns = [
  { value: "float", label: "Float" },
  { value: "orbital", label: "Orbital" },
  { value: "bounce", label: "Bounce" },
  { value: "wave", label: "Wave" },
  { value: "spiral", label: "Spiral" },
  { value: "pulse", label: "Pulse" },
];

type AnimationType = "geometric" | "wavefield" | "ascii" | "tunnel";

export default function Home() {
  const [type, setType] = useState<AnimationType>("ascii");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Shared
  const [seed, setSeed] = useState(42);
  const [duration] = useState(10);
  const [enableNoise, setEnableNoise] = useState(true);
  const [enableVignette, setEnableVignette] = useState(true);

  // ASCII
  const [asciiPattern, setAsciiPattern] = useState("donut");
  const [asciiSpeed, setAsciiSpeed] = useState(1);
  const [asciiDensity, setAsciiDensity] = useState(1);
  const [asciiColorMode, setAsciiColorMode] = useState("green");
  const [asciiColor, setAsciiColor] = useState("#00ff00");

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

  // Geometric
  const [geoShape, setGeoShape] = useState("hexagon");
  const [shapeCount, setShapeCount] = useState(3);
  const [motionPattern, setMotionPattern] = useState("float");
  const [motionSpeed, setMotionSpeed] = useState(1);
  const [primaryColor, setPrimaryColor] = useState("#fbbf24");
  const [accentColor, setAccentColor] = useState("#ec4899");
  const [bgColor, setBgColor] = useState("#0a1628");

  // Rainbow config
  const [hueStart, setHueStart] = useState(0);
  const [hueEnd, setHueEnd] = useState(360);
  const [saturation, setSaturation] = useState(80);
  const [lightness, setLightness] = useState(60);

  const rainbowConfig = useMemo(() => ({
    ...defaultRainbowConfig,
    hueStart,
    hueEnd,
    saturation,
    lightness,
    animate: true,
    speed: 1,
  }), [hueStart, hueEnd, saturation, lightness]);

  const randomize = () => {
    setSeed(Math.floor(Math.random() * 10000));

    if (type === "ascii") {
      setAsciiPattern(asciiPatterns[Math.floor(Math.random() * asciiPatterns.length)].value);
      setAsciiSpeed(0.5 + Math.random() * 2);
      setAsciiDensity(0.7 + Math.random() * 0.6);
      setAsciiColorMode(asciiColorModes[Math.floor(Math.random() * asciiColorModes.length)].value);
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
    } else if (type === "geometric") {
      setGeoShape(geometricShapes[Math.floor(Math.random() * geometricShapes.length)].value);
      setShapeCount(1 + Math.floor(Math.random() * 5));
      setMotionPattern(motionPatterns[Math.floor(Math.random() * motionPatterns.length)].value);
      setMotionSpeed(0.5 + Math.random() * 2);
    }

    // Randomize rainbow
    setHueStart(Math.floor(Math.random() * 360));
    setHueEnd(Math.floor(Math.random() * 360));
  };

  const asciiProps = useMemo(() => ({
    pattern: asciiPattern as any,
    backgroundColor: "#000000",
    textColor: asciiColorMode === "single" ? asciiColor : "#00ff00",
    colorMode: asciiColorMode as any,
    rainbowConfig,
    speed: asciiSpeed,
    density: asciiDensity,
    enableNoise,
    enableVignette,
    seed,
  }), [asciiPattern, asciiSpeed, asciiDensity, asciiColorMode, asciiColor, rainbowConfig, enableNoise, enableVignette, seed]);

  const waveProps = useMemo(() => ({
    backgroundColor: "#000000",
    lineColor: waveColorMode === "single" ? waveColor : "#ffffff",
    pattern: wavePattern as any,
    lineCount,
    segmentsPerLine: 100,
    amplitude: waveAmplitude,
    frequency: waveFrequency,
    speed: waveSpeed,
    perspective: wavePerspective,
    rotationSpeed: 0.5,
    enableNoise,
    enableVignette,
    seed,
    colorMode: waveColorMode as any,
    rainbowConfig,
  }), [wavePattern, lineCount, waveAmplitude, waveFrequency, waveSpeed, wavePerspective, waveColorMode, waveColor, rainbowConfig, enableNoise, enableVignette, seed]);

  const tunnelProps = useMemo(() => ({
    backgroundColor: "#000000",
    primaryColor: "#ffffff",
    pattern: tunnelPatternType as any,
    shapeType: tunnelShape as any,
    layerCount,
    colorMode: "rainbow" as const,
    rainbowConfig,
    gradientColors: ["#ff0066", "#6600ff", "#00ff66"],
    zoomSpeed,
    zoomDirection: zoomDirection as any,
    enableMeshGradient: false,
    meshColors: ["#ff0066", "#6600ff", "#00ff66"],
    enableGlow,
    glowIntensity,
    strokeWidth: 3,
    enableNoise,
    enableVignette,
    rotationSpeed: tunnelRotation,
    seed,
  }), [tunnelShape, tunnelPatternType, zoomSpeed, zoomDirection, layerCount, tunnelRotation, enableGlow, glowIntensity, rainbowConfig, enableNoise, enableVignette, seed]);

  const geometricProps = useMemo(() => ({
    backgroundColor: bgColor,
    primaryColor,
    accentColor,
    shape: geoShape as any,
    shapeCount,
    mixShapes: false,
    enableNoise,
    enableScanlines: true,
    enableParticles: true,
    enableVignette,
    enableGlitch: false,
    enableDither: true,
    ditherPattern: "bayer" as const,
    enableBloom: true,
    enableChromaticAberration: false,
    enableMirror: false,
    enableTrails: false,
    motionPattern: motionPattern as any,
    motionSpeed,
    motionIntensity: 1,
    seed,
  }), [geoShape, shapeCount, motionPattern, motionSpeed, primaryColor, accentColor, bgColor, enableNoise, enableVignette, seed]);

  return (
    <div className="h-screen w-screen bg-neutral-950 flex flex-col overflow-hidden">
      {/* Video Player */}
      <div className="flex-1 relative min-h-0">
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
                  value="geometric"
                  className="text-sm text-neutral-300 data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
                >
                  Geometric
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
              {type === "geometric" && (
                <Select value={geoShape} onValueChange={setGeoShape}>
                  <SelectTrigger className="w-32 h-9 text-sm bg-neutral-800 border-neutral-700 text-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700">
                    {geometricShapes.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-sm text-neutral-200">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="h-6 w-px bg-neutral-700" />

            {/* Primary Slider */}
            <div className="flex items-center gap-3 min-w-[180px]">
              <Label className="text-sm text-neutral-400 w-12">
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
              <span className="text-sm text-neutral-500 w-8 text-right tabular-nums">
                {type === "ascii" ? asciiSpeed.toFixed(1) : type === "wavefield" ? lineCount : type === "tunnel" ? zoomSpeed.toFixed(1) : shapeCount}
              </span>
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
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Density</Label>
                      <Slider
                        value={[asciiDensity]}
                        onValueChange={([v]) => setAsciiDensity(v)}
                        min={0.5}
                        max={1.5}
                        step={0.1}
                      />
                    </div>
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
                  </>
                )}

                {type === "wavefield" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Amplitude</Label>
                      <Slider
                        value={[waveAmplitude]}
                        onValueChange={([v]) => setWaveAmplitude(v)}
                        min={10}
                        max={150}
                        step={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Frequency</Label>
                      <Slider
                        value={[waveFrequency]}
                        onValueChange={([v]) => setWaveFrequency(v)}
                        min={0.5}
                        max={8}
                        step={0.5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Speed</Label>
                      <Slider
                        value={[waveSpeed]}
                        onValueChange={([v]) => setWaveSpeed(v)}
                        min={0.1}
                        max={3}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Perspective</Label>
                      <Slider
                        value={[wavePerspective]}
                        onValueChange={([v]) => setWavePerspective(v)}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>
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
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Layers</Label>
                      <Slider
                        value={[layerCount]}
                        onValueChange={([v]) => setLayerCount(v)}
                        min={10}
                        max={60}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Rotation</Label>
                      <Slider
                        value={[tunnelRotation]}
                        onValueChange={([v]) => setTunnelRotation(v)}
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Glow</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={enableGlow}
                          onChange={(e) => setEnableGlow(e.target.checked)}
                          className="rounded border-neutral-700"
                        />
                        <Slider
                          value={[glowIntensity]}
                          onValueChange={([v]) => setGlowIntensity(v)}
                          min={0.3}
                          max={2}
                          step={0.1}
                          disabled={!enableGlow}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </>
                )}

                {type === "geometric" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Motion</Label>
                      <Select value={motionPattern} onValueChange={setMotionPattern}>
                        <SelectTrigger className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700">
                          {motionPatterns.map((m) => (
                            <SelectItem key={m.value} value={m.value} className="text-xs text-neutral-200">
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Speed</Label>
                      <Slider
                        value={[motionSpeed]}
                        onValueChange={([v]) => setMotionSpeed(v)}
                        min={0.1}
                        max={3}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Primary</Label>
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-8 w-full p-1 bg-neutral-800 border-neutral-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Accent</Label>
                      <Input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-8 w-full p-1 bg-neutral-800 border-neutral-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-neutral-400">Background</Label>
                      <Input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-8 w-full p-1 bg-neutral-800 border-neutral-700"
                      />
                    </div>
                  </>
                )}

                {/* Shared controls */}
                <div className="space-y-2">
                  <Label className="text-xs text-neutral-400">Hue Range</Label>
                  <div className="flex gap-1">
                    <Slider
                      value={[hueStart]}
                      onValueChange={([v]) => setHueStart(v)}
                      min={0}
                      max={360}
                      step={5}
                      className="flex-1"
                    />
                    <Slider
                      value={[hueEnd]}
                      onValueChange={([v]) => setHueEnd(v)}
                      min={0}
                      max={360}
                      step={5}
                      className="flex-1"
                    />
                  </div>
                </div>

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
                  <Label className="text-xs text-neutral-400">Seed</Label>
                  <Input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                    className="h-8 text-xs bg-neutral-800 border-neutral-700 text-neutral-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
