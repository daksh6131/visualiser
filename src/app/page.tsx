"use client";

import { useState } from "react";
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
import { ShaderCanvas } from "@/components/ShaderCanvas";
import { TunnelCanvas } from "@/components/TunnelCanvas";
import { WaveCanvas } from "@/components/WaveCanvas";
import { GeometricCanvas } from "@/components/GeometricCanvas";
import { AsciiCanvas } from "@/components/AsciiCanvas";

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

const shaderPatterns = [
  { value: "hypnotic", label: "Hypnotic" },
  { value: "voronoi", label: "Voronoi" },
  { value: "kaleidoscope", label: "Kaleidoscope" },
  { value: "plasma", label: "Plasma" },
  { value: "tunnel", label: "Tunnel" },
  { value: "fractal", label: "Fractal" },
  { value: "moire", label: "Moiré" },
  { value: "waves", label: "Waves" },
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

type AnimationType = "geometric" | "wavefield" | "ascii" | "tunnel" | "shader";

export default function Home() {
  const [type, setType] = useState<AnimationType>("shader");
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  // Shader
  const [shaderPattern, setShaderPattern] = useState("hypnotic");
  const [shaderSpeed, setShaderSpeed] = useState(1);
  const [shaderComplexity, setShaderComplexity] = useState(1);
  const [shaderColorA, setShaderColorA] = useState("#00ffff");
  const [shaderColorB, setShaderColorB] = useState("#ff0066");
  const [shaderColorC, setShaderColorC] = useState("#000000");
  const [shaderSymmetry, setShaderSymmetry] = useState(3);
  const [shaderZoom, setShaderZoom] = useState(1);
  const [shaderRotation, setShaderRotation] = useState(0);

  // Rainbow config
  const [hueStart, setHueStart] = useState(0);
  const [hueEnd, setHueEnd] = useState(360);
  const [saturation, setSaturation] = useState(80);
  const [lightness, setLightness] = useState(60);

  const randomize = () => {
    setSeed(Math.floor(Math.random() * 10000));

    if (type === "ascii") {
      setAsciiPattern(asciiPatterns[Math.floor(Math.random() * asciiPatterns.length)].value);
      setAsciiSpeed(0.5 + Math.random() * 2);
      setAsciiDensity(0.7 + Math.random() * 0.6);
      setAsciiColorMode(asciiColorModes[Math.floor(Math.random() * asciiColorModes.length)].value);
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
    } else if (type === "geometric") {
      setGeoShape(geometricShapes[Math.floor(Math.random() * geometricShapes.length)].value);
      setShapeCount(1 + Math.floor(Math.random() * 5));
      setMotionPattern(motionPatterns[Math.floor(Math.random() * motionPatterns.length)].value);
      setMotionSpeed(0.5 + Math.random() * 2);
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
            />
          )}
          {type === "wavefield" && (
            <WaveCanvas
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
          {type === "geometric" && (
            <GeometricCanvas
              shape={geoShape as any}
              shapeCount={shapeCount}
              motionPattern={motionPattern as any}
              motionSpeed={motionSpeed}
              primaryColor={primaryColor}
              accentColor={accentColor}
              backgroundColor={bgColor}
              enableNoise={enableNoise}
              enableVignette={enableVignette}
              seed={seed}
            />
          )}
          {type === "shader" && (
            <ShaderCanvas
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
                <TabsTrigger
                  value="shader"
                  className="text-sm text-neutral-300 data-[state=active]:bg-neutral-700 data-[state=active]:text-white"
                >
                  Shader
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
            </div>

            <div className="h-6 w-px bg-neutral-700" />

            {/* Primary Slider with Input */}
            <div className="flex items-center gap-3 min-w-[220px]">
              <Label className="text-sm text-neutral-400 w-12">
                {type === "ascii" ? "Speed" : type === "wavefield" ? "Lines" : type === "tunnel" ? "Speed" : type === "shader" ? "Speed" : "Count"}
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
              {type === "geometric" && (
                <>
                  <Slider
                    value={[shapeCount]}
                    onValueChange={([v]) => setShapeCount(v)}
                    min={1}
                    max={8}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={shapeCount}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v)) setShapeCount(Math.min(8, Math.max(1, v)));
                    }}
                    min={1}
                    max={8}
                    step={1}
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
                    <SliderWithInput
                      label="Density"
                      value={asciiDensity}
                      onChange={setAsciiDensity}
                      min={0.5}
                      max={1.5}
                      step={0.1}
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
                    <SliderWithInput
                      label="Speed"
                      value={motionSpeed}
                      onChange={setMotionSpeed}
                      min={0.1}
                      max={3}
                      step={0.1}
                    />
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
